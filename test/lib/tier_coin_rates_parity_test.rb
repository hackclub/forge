require "test_helper"

class TierCoinRatesParityTest < ActiveSupport::TestCase
  TS_PATH = Rails.root.join("app/javascript/lib/tiers.ts")

  test "tiers.ts coin rates match Project::TIER_COIN_RATES" do
    source = File.read(TS_PATH)
    block = source[/TIER_COIN_RATES[^=]*=\s*\{(.*?)\}/m, 1]
    assert block, "could not find TIER_COIN_RATES in #{TS_PATH}"

    frontend = block.scan(/(\w+):\s*([\d.]+)/).to_h { |tier, rate| [ tier, rate.to_f ] }
    backend = Project::TIER_COIN_RATES.transform_values(&:to_f)

    assert_equal backend, frontend
  end
end
