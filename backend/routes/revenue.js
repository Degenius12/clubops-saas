const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const puppeteer = require('puppeteer');
const path = require('path');

const prisma = new PrismaClient();
const router = express.Router();

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  const ranges = {
    today: {
      start: new Date(now.setHours(0, 0, 0, 0)),
      end: new Date(now.setHours(23, 59, 59, 999))
    },
    yesterday: {
      start: new Date(new Date().setDate(now.getDate() - 1)),
      end: new Date(new Date().setDate(now.getDate() - 1))
    },
    week: {
      start: new Date(new Date().setDate(now.getDate() - 7)),
      end: new Date()
    },
    month: {
      start: new Date(new Date().setMonth(now.getMonth() - 1)),
      end: new Date()
    },
    year: {
      start: new Date(new Date().setFullYear(now.getFullYear() - 1)),
      end: new Date()
    }
  };

  // Default to today
  return ranges[period] || ranges.today;
};

// @route   GET /api/revenue/summary
// @desc    Get revenue summary for owner dashboard (Feature #17)
// @access  Private (Owner only)
router.get('/summary', auth, authorize('owner'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's revenue
    const todayRevenue = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: { gte: today }
      }
    });

    // Get yesterday's revenue for comparison
    const yesterdayRevenue = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    });

    // Get today's revenue breakdown by category
    const revenueByCategory = await prisma.financialTransaction.groupBy({
      by: ['transactionType'],
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: { gte: today }
      }
    });

    // Format category breakdown
    const breakdown = {
      bar_fees: 0,
      vip_fees: 0,
      cover_charges: 0,
      other: 0
    };

    revenueByCategory.forEach(item => {
      const amount = parseFloat(item._sum.amount || 0);
      const txType = item.transactionType.toLowerCase();
      if (txType === 'bar_fee' || txType === 'bar_fees') {
        breakdown.bar_fees += amount;
      } else if (txType.includes('vip') || txType.includes('VIP')) {
        breakdown.vip_fees += amount;
      } else if (txType === 'cover_charge' || txType.includes('cover')) {
        breakdown.cover_charges += amount;
      } else {
        breakdown.other += amount;
      }
    });

    // Calculate comparison percentage
    const todayTotal = parseFloat(todayRevenue._sum.amount || 0);
    const yesterdayTotal = parseFloat(yesterdayRevenue._sum.amount || 0);
    const comparisonPercent = yesterdayTotal > 0
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1)
      : 0;

    res.json({
      today: {
        total: todayTotal,
        breakdown
      },
      yesterday: {
        total: yesterdayTotal
      },
      comparison: {
        amount: todayTotal - yesterdayTotal,
        percent: parseFloat(comparisonPercent),
        trend: todayTotal >= yesterdayTotal ? 'up' : 'down'
      }
    });

  } catch (error) {
    console.error('Revenue summary error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
});

// @route   GET /api/revenue/weekly
// @desc    Get weekly revenue trends (Feature #18)
// @access  Private (Owner only)
router.get('/weekly', auth, authorize('owner'), async (req, res) => {
  try {
    const { clubId } = req.user;

    // Get last 7 days of revenue
    const dailyRevenue = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRevenue = await prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
          clubId,
          status: 'PAID',
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        total: parseFloat(dayRevenue._sum.amount || 0)
      });
    }

    // Calculate weekly total
    const weeklyTotal = dailyRevenue.reduce((sum, day) => sum + day.total, 0);

    // Get previous week for comparison
    const prevWeekStart = new Date();
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);
    prevWeekStart.setHours(0, 0, 0, 0);

    const prevWeekEnd = new Date();
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
    prevWeekEnd.setHours(23, 59, 59, 999);

    const prevWeekRevenue = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: {
          gte: prevWeekStart,
          lt: prevWeekEnd
        }
      }
    });

    const prevWeekTotal = parseFloat(prevWeekRevenue._sum.amount || 0);
    const weeklyChange = prevWeekTotal > 0
      ? ((weeklyTotal - prevWeekTotal) / prevWeekTotal * 100).toFixed(1)
      : 0;

    res.json({
      daily: dailyRevenue,
      weekly_total: weeklyTotal,
      previous_week_total: prevWeekTotal,
      change_percent: parseFloat(weeklyChange),
      trend: weeklyTotal >= prevWeekTotal ? 'up' : 'down'
    });

  } catch (error) {
    console.error('Weekly revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly revenue' });
  }
});

// @route   GET /api/revenue/monthly
// @desc    Get monthly revenue with weekly breakdown (Feature #19)
// @access  Private (Owner only)
router.get('/monthly', auth, authorize('owner'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { year, month } = req.query;

    // Use provided year/month or default to current
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth(); // month is 0-indexed

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Get weekly breakdown for the month
    const weeklyBreakdown = [];
    let currentWeekStart = new Date(monthStart);

    while (currentWeekStart <= monthEnd) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Don't go beyond month end
      const actualWeekEnd = weekEnd > monthEnd ? monthEnd : weekEnd;

      const weekRevenue = await prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
          clubId,
          status: 'PAID',
          createdAt: {
            gte: currentWeekStart,
            lte: actualWeekEnd
          }
        }
      });

      // Get breakdown by category for this week
      const categoryBreakdown = await prisma.financialTransaction.groupBy({
        by: ['transactionType'],
        _sum: { amount: true },
        where: {
          clubId,
          status: 'PAID',
          createdAt: {
            gte: currentWeekStart,
            lte: actualWeekEnd
          }
        }
      });

      const categories = {
        HOUSE_FEE: 0,
        TIP_OUT: 0,
        VIP_SESSION: 0,
        TIP: 0,
        BONUS: 0,
        OTHER: 0
      };

      categoryBreakdown.forEach(item => {
        const amount = parseFloat(item._sum.amount || 0);
        if (categories.hasOwnProperty(item.transactionType)) {
          categories[item.transactionType] = amount;
        } else {
          categories.OTHER += amount;
        }
      });

      weeklyBreakdown.push({
        weekNumber: weeklyBreakdown.length + 1,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: actualWeekEnd.toISOString().split('T')[0],
        total: parseFloat(weekRevenue._sum.amount || 0),
        categories
      });

      // Move to next week
      currentWeekStart = new Date(actualWeekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      currentWeekStart.setHours(0, 0, 0, 0);
    }

    // Get total month revenue
    const monthRevenue = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // Get previous month for comparison
    const prevMonthStart = new Date(targetYear, targetMonth - 1, 1);
    const prevMonthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const prevMonthRevenue = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: {
          gte: prevMonthStart,
          lte: prevMonthEnd
        }
      }
    });

    const monthTotal = parseFloat(monthRevenue._sum.amount || 0);
    const prevMonthTotal = parseFloat(prevMonthRevenue._sum.amount || 0);
    const monthlyChange = prevMonthTotal > 0
      ? ((monthTotal - prevMonthTotal) / prevMonthTotal * 100).toFixed(1)
      : 0;

    // Get category breakdown for entire month
    const monthlyCategoryBreakdown = await prisma.financialTransaction.groupBy({
      by: ['transactionType'],
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    const monthlyCategories = {
      HOUSE_FEE: 0,
      TIP_OUT: 0,
      VIP_SESSION: 0,
      TIP: 0,
      BONUS: 0,
      OTHER: 0
    };

    monthlyCategoryBreakdown.forEach(item => {
      const amount = parseFloat(item._sum.amount || 0);
      if (monthlyCategories.hasOwnProperty(item.transactionType)) {
        monthlyCategories[item.transactionType] = amount;
      } else {
        monthlyCategories.OTHER += amount;
      }
    });

    res.json({
      month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      total: monthTotal,
      previous_month_total: prevMonthTotal,
      change_percent: parseFloat(monthlyChange),
      trend: monthTotal >= prevMonthTotal ? 'up' : 'down',
      weekly_breakdown: weeklyBreakdown,
      categories: monthlyCategories
    });

  } catch (error) {
    console.error('Monthly revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
});

// @route   GET /api/revenue/monthly-pdf
// @desc    Generate PDF export of monthly revenue report (Feature #19)
// @access  Private (Owner only)
router.get('/monthly-pdf', auth, authorize('owner'), async (req, res) => {
  let browser;
  try {
    const { clubId } = req.user;
    const { year, month } = req.query;

    // Get the same data as monthly endpoint
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Fetch weekly breakdown
    const weeklyBreakdown = [];
    let currentWeekStart = new Date(monthStart);

    while (currentWeekStart <= monthEnd) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const actualWeekEnd = weekEnd > monthEnd ? monthEnd : weekEnd;

      const weekRevenue = await prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
          clubId,
          status: 'PAID',
          createdAt: { gte: currentWeekStart, lte: actualWeekEnd }
        }
      });

      const categoryBreakdown = await prisma.financialTransaction.groupBy({
        by: ['transactionType'],
        _sum: { amount: true },
        where: {
          clubId,
          status: 'PAID',
          createdAt: { gte: currentWeekStart, lte: actualWeekEnd }
        }
      });

      const categories = {
        HOUSE_FEE: 0,
        TIP_OUT: 0,
        VIP_SESSION: 0,
        TIP: 0,
        BONUS: 0,
        OTHER: 0
      };

      categoryBreakdown.forEach(item => {
        const amount = parseFloat(item._sum.amount || 0);
        if (categories.hasOwnProperty(item.transactionType)) {
          categories[item.transactionType] = amount;
        } else {
          categories.OTHER += amount;
        }
      });

      weeklyBreakdown.push({
        weekNumber: weeklyBreakdown.length + 1,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: actualWeekEnd.toISOString().split('T')[0],
        total: parseFloat(weekRevenue._sum.amount || 0),
        categories
      });

      currentWeekStart = new Date(actualWeekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      currentWeekStart.setHours(0, 0, 0, 0);
    }

    // Get total month revenue
    const monthRevenue = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    });

    // Get previous month for comparison
    const prevMonthStart = new Date(targetYear, targetMonth - 1, 1);
    const prevMonthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const prevMonthRevenue = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd }
      }
    });

    const monthTotal = parseFloat(monthRevenue._sum.amount || 0);
    const prevMonthTotal = parseFloat(prevMonthRevenue._sum.amount || 0);
    const monthlyChange = prevMonthTotal > 0
      ? ((monthTotal - prevMonthTotal) / prevMonthTotal * 100).toFixed(1)
      : 0;

    // Get category breakdown for entire month
    const monthlyCategoryBreakdown = await prisma.financialTransaction.groupBy({
      by: ['transactionType'],
      _sum: { amount: true },
      where: {
        clubId,
        status: 'PAID',
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    });

    const monthlyCategories = {
      HOUSE_FEE: 0,
      TIP_OUT: 0,
      VIP_SESSION: 0,
      TIP: 0,
      BONUS: 0,
      OTHER: 0
    };

    monthlyCategoryBreakdown.forEach(item => {
      const amount = parseFloat(item._sum.amount || 0);
      if (monthlyCategories.hasOwnProperty(item.transactionType)) {
        monthlyCategories[item.transactionType] = amount;
      } else {
        monthlyCategories.OTHER += amount;
      }
    });

    // Generate HTML for PDF
    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 40px;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          h1 { font-size: 32px; margin-bottom: 10px; color: #1e40af; }
          .subtitle { font-size: 16px; color: #6b7280; }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 12px;
            color: white;
          }
          .summary-card.green { background: linear-gradient(135deg, #34d399 0%, #10b981 100%); }
          .summary-card.blue { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
          .summary-card h3 { font-size: 14px; margin-bottom: 8px; opacity: 0.9; }
          .summary-card .value { font-size: 28px; font-weight: bold; }
          .summary-card .change { font-size: 12px; margin-top: 8px; opacity: 0.85; }

          .section { margin-bottom: 40px; }
          .section h2 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #1e40af;
            border-left: 4px solid #3b82f6;
            padding-left: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:hover { background: #f9fafb; }

          .chart-container {
            margin: 30px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .bar-chart {
            display: flex;
            align-items: flex-end;
            height: 200px;
            gap: 12px;
            padding: 20px;
          }
          .bar {
            flex: 1;
            background: linear-gradient(180deg, #3b82f6 0%, #1e40af 100%);
            border-radius: 4px 4px 0 0;
            position: relative;
            min-height: 20px;
          }
          .bar-label {
            text-align: center;
            font-size: 11px;
            margin-top: 8px;
            color: #6b7280;
          }
          .bar-value {
            position: absolute;
            top: -25px;
            width: 100%;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: #1f2937;
          }

          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Monthly Revenue Report</h1>
          <div class="subtitle">${monthName} | Generated ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="summary">
          <div class="summary-card green">
            <h3>Total Revenue</h3>
            <div class="value">$${monthTotal.toFixed(2)}</div>
            <div class="change">${monthlyChange > 0 ? '↑' : '↓'} ${Math.abs(monthlyChange)}% vs prev month</div>
          </div>
          <div class="summary-card blue">
            <h3>Previous Month</h3>
            <div class="value">$${prevMonthTotal.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <h3>Average Weekly</h3>
            <div class="value">$${(monthTotal / weeklyBreakdown.length).toFixed(2)}</div>
          </div>
        </div>

        <div class="section">
          <h2>Weekly Breakdown</h2>
          <div class="chart-container">
            <div class="bar-chart">
              ${weeklyBreakdown.map(week => {
                const maxWeekly = Math.max(...weeklyBreakdown.map(w => w.total));
                const heightPercent = maxWeekly > 0 ? (week.total / maxWeekly) * 100 : 0;
                return `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <div class="bar" style="height: ${heightPercent}%;">
                      <div class="bar-value">$${week.total.toFixed(0)}</div>
                    </div>
                    <div class="bar-label">Week ${week.weekNumber}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Period</th>
                <th>House Fees</th>
                <th>Tip Outs</th>
                <th>VIP Sessions</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyBreakdown.map(week => `
                <tr>
                  <td>Week ${week.weekNumber}</td>
                  <td>${week.startDate} to ${week.endDate}</td>
                  <td>$${week.categories.HOUSE_FEE.toFixed(2)}</td>
                  <td>$${week.categories.TIP_OUT.toFixed(2)}</td>
                  <td>$${week.categories.VIP_SESSION.toFixed(2)}</td>
                  <td><strong>$${week.total.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Revenue by Category</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(monthlyCategories).map(([category, amount]) => {
                const percent = monthTotal > 0 ? (amount / monthTotal * 100).toFixed(1) : 0;
                return `
                  <tr>
                    <td>${category.replace('_', ' ')}</td>
                    <td>$${amount.toFixed(2)}</td>
                    <td>${percent}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>ClubFlow Management System | Confidential Report</p>
          <p>This report contains sensitive financial information</p>
        </div>
      </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true
    });

    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${monthName.replace(' ', '-')}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) {
      await browser.close();
    }
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// @route   GET /api/revenue/all
// @desc    Get all revenue metrics (daily, weekly, monthly, yearly)
// @access  Private (Owner only)
router.get('/all', auth, authorize('owner'), async (req, res) => {
  try {
    const { clubId } = req.user;

    // Helper to get revenue for period
    const getRevenue = async (start, end) => {
      const result = await prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
          clubId,
          status: 'PAID',
          createdAt: { gte: start, lte: end }
        }
      });
      return parseFloat(result._sum.amount || 0);
    };

    const now = new Date();

    // Today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const todayRevenue = await getRevenue(todayStart, todayEnd);

    // This week (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekRevenue = await getRevenue(weekStart, now);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthRevenue = await getRevenue(monthStart, monthEnd);

    // This year
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    const yearRevenue = await getRevenue(yearStart, yearEnd);

    res.json({
      today: todayRevenue,
      week: weekRevenue,
      month: monthRevenue,
      year: yearRevenue
    });

  } catch (error) {
    console.error('All revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue metrics' });
  }
});

module.exports = router;
