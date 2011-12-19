# Create rows for site options
for option_name in SiteOption::Names
  SiteOption.find_or_create_by_option_name option_name
end