# Lead Database Template (Google Sheets)

## Columns to Create:

1. **Club Name** (Text)
2. **City** (Text)
3. **State** (Dropdown: All 50 states)
4. **Phone** (Text formatted as phone number)
5. **Website** (URL)
6. **Contact Name** (Text)
7. **Contact Email** (Email format)
8. **Contact Title** (Dropdown: Owner, GM, Manager, Unknown)
9. **Source** (Dropdown: Liquor DB, Google Maps, Yelp, LinkedIn, Referral, Other)
10. **Tier** (Dropdown: 1A, 1B, 1C, 2, 3)
    - 1A = Multi-location
    - 1B = Major metro single location
    - 1C = Recent expanders
    - 2 = Mid-tier
    - 3 = Low priority
11. **Status** (Dropdown: New, Contacted, Opened, Replied, Demo Scheduled, Trial, Customer, Dead)
12. **Notes** (Text - for specific observations)
13. **Last Contact Date** (Date)
14. **Next Follow-up Date** (Date)
15. **Email Campaign** (Dropdown: None, Campaign 1, Campaign 2, etc.)
16. **Open Rate** (Checkbox - did they open email?)
17. **Estimated Dancers** (Number - for tier qualification)
18. **Multi-Location?** (Checkbox)
19. **Google Rating** (Number 1-5)
20. **Tags** (Text - comma separated: "high value, referred by John, recent renovation")

## Tier Qualification Criteria:

### Tier 1A (Highest Priority - Multi-Location):
- Owns 2+ clubs
- Higher LTV potential
- Budget for software
- **Target**: 20 clubs

### Tier 1B (High Priority - Major Metro):
- Single location in: NYC, LA, Vegas, Miami, Atlanta, Dallas, Houston, Chicago
- 20+ dancers typical
- High volume revenue
- **Target**: 40 clubs

### Tier 1C (High Priority - Recent Investment):
- Recent renovation mentioned in reviews
- New liquor license (< 2 years)
- Expanding (new VIP area, etc.)
- Shows willingness to invest
- **Target**: 40 clubs

### Tier 2 (Medium Priority):
- Mid-size cities
- 10-20 dancers
- Standard operations
- **Target**: 200 clubs

### Tier 3 (Low Priority):
- Small towns
- <10 dancers
- Limited budget indicators
- **Target**: 200 clubs

## Status Definitions:

- **New**: Just added to database, never contacted
- **Contacted**: Email sent (track date)
- **Opened**: They opened the email
- **Replied**: They responded (any response)
- **Demo Scheduled**: Calendly booked
- **Trial**: Using free trial
- **Customer**: Paying customer
- **Dead**: Explicitly said no / not interested / bad fit

## Conditional Formatting Rules:

1. **Tier 1A rows**: Light green background
2. **Tier 1B rows**: Light yellow background
3. **Status = "Customer"**: Dark green background, white text
4. **Status = "Demo Scheduled"**: Light blue background
5. **Status = "Dead"**: Gray background, strikethrough text
6. **Next Follow-up Date < Today**: Red background (overdue follow-up)

## Formulas to Add:

### Days Since Last Contact:
```
=IF(M2="","",TODAY()-M2)
```
(Shows how long since you last reached out)

### Auto-Set Next Follow-up:
```
=IF(K2="Contacted",M2+3,
  IF(K2="Opened",M2+3,
  IF(K2="Replied",M2+1,"")))
```
(Automatically calculates next follow-up based on status)

### Lead Score (0-100):
```
=
  IF(J2="1A",40,IF(J2="1B",30,IF(J2="1C",30,10))) +
  IF(R2="TRUE",20,0) +
  IF(Q2>=20,20,IF(Q2>=10,10,5)) +
  IF(S2>=4,20,IF(S2>=3,10,0))
```
(Scores based on: Tier + Multi-location + Dancer count + Google rating)

## View Filters to Create:

1. **Active Pipeline**: Status = "Contacted" OR "Opened" OR "Replied" OR "Demo Scheduled"
2. **Follow-up Needed**: Next Follow-up Date <= Today
3. **Tier 1 Only**: Tier = "1A" OR "1B" OR "1C"
4. **Warm Leads**: Status = "Replied" OR "Demo Scheduled" OR "Trial"
5. **Dead Leads**: Status = "Dead"
6. **No Contact Yet**: Status = "New"

## Data Validation Rules:

- State: Dropdown from preset list
- Status: Dropdown (New, Contacted, Opened, Replied, Demo Scheduled, Trial, Customer, Dead)
- Tier: Dropdown (1A, 1B, 1C, 2, 3)
- Source: Dropdown (Liquor DB, Google Maps, Yelp, LinkedIn, Referral, Other)
- Contact Title: Dropdown (Owner, GM, Manager, Unknown)

## Example Data (First 3 Rows):

| Club Name | City | State | Phone | Contact Name | Status | Tier | Notes |
|-----------|------|-------|-------|--------------|--------|------|-------|
| Sapphire Las Vegas | Las Vegas | NV | 702-555-0100 | John Smith | New | 1B | 25+ dancers, 3 VIP suites, high Yelp rating |
| Spearmint Rhino (Chain) | Multiple | CA | 818-555-0200 | Mike Johnson | Contacted | 1A | 6 locations, corporate contact |
| The Lodge | Atlanta | GA | 404-555-0300 | Sarah Williams | Demo Scheduled | 1B | Recent renovation, referred by [Name] |

## Export/Backup:
- **Weekly**: Download as CSV backup
- **Before campaigns**: Segment and export target list
- **After campaigns**: Import results (opens, replies)

## Integration with Email Tools:
- Export CSV for GMass import
- Map columns: Email, FirstName, ClubName, City
- Use merge tags in templates: {{ClubName}}, {{FirstName}}

## Privacy & Compliance:
- Only business contact information
- No personal emails/phones
- Respect unsubscribes immediately
- Add to dead leads if they opt out
- CCPA compliant (business info is public record)

## Tips:
1. **Update religiously**: Every interaction, every note
2. **Be specific in Notes**: "Owner mentioned fraud concerns" beats "interested"
3. **Track everything**: Even negative responses teach you something
4. **Review weekly**: Sort by lead score, prioritize high-value
5. **Celebrate wins**: Highlight customers, track path to conversion
