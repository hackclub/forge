module HasRegion
  extend ActiveSupport::Concern

  REGIONS = {
    "united_states" => "United States",
    "eu" => "EU",
    "united_kingdom" => "United Kingdom",
    "india" => "India",
    "canada" => "Canada",
    "australia" => "Australia",
    "rest_of_world" => "Rest of World"
  }.freeze

  REGION_KEYS = REGIONS.keys.freeze
end
