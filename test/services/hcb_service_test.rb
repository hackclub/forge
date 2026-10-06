require "test_helper"

class HcbServiceTest < ActiveSupport::TestCase
  setup do
    [
      HcbService::ACCESS_TOKEN_SETTING,
      HcbService::REFRESH_TOKEN_SETTING,
      HcbService::EXPIRES_AT_SETTING,
      HcbService::ACCOUNT_SETTING
    ].each { |key| AppSetting.clear(key) }
  end

  def with_v4_stubs
    stubs = Faraday::Adapter::Test::Stubs.new
    connection = Faraday.new(url: HcbService::V4_BASE) do |f|
      f.headers["Content-Type"] = "application/json"
      f.adapter :test, stubs
    end
    original = HcbService.method(:v4_connection)
    HcbService.define_singleton_method(:v4_connection) { connection }
    yield stubs
    stubs.verify_stubbed_calls
  ensure
    HcbService.define_singleton_method(:v4_connection, original)
  end

  def with_access_token(token = "access-token")
    original = HcbService.method(:access_token)
    HcbService.define_singleton_method(:access_token) { token }
    yield
  ensure
    HcbService.define_singleton_method(:access_token, original)
  end

  def direct_grant_order(amount_usd: 25)
    Order.new(user: users(:one), project: projects(:one), kind: "direct_grant", amount_usd: amount_usd, coin_cost: amount_usd)
  end

  def json(body)
    [ 200, { "Content-Type" => "application/json" }, body.to_json ]
  end

  test "grant_link strips the public id prefix" do
    assert_equal "https://hcb.hackclub.com/grants/abc12", HcbService.grant_link("cdg_abc12")
    assert_equal "https://hcb.hackclub.com/grants/abc12", HcbService.grant_link("abc12")
  end

  test "create_card_grant! posts the order's amount, recipient, purpose and instructions" do
    order = direct_grant_order
    received = nil

    with_access_token do
      with_v4_stubs do |stubs|
        stubs.post("/api/v4/organizations/#{HcbService::ORG_SLUG}/card_grants") do |env|
          received = { headers: env.request_headers, body: JSON.parse(env.body) }
          [ 201, { "Content-Type" => "application/json" }, { id: "cdg_x9", object: "card_grant", status: "active", amount_cents: 2500 }.to_json ]
        end

        result = HcbService.create_card_grant!(order)

        assert_equal "cdg_x9", result[:id]
        assert_equal "https://hcb.hackclub.com/grants/x9", result[:link]
        assert_equal 2500, result[:amount_cents]
      end
    end

    assert_equal "Bearer access-token", received[:headers]["Authorization"]
    assert_equal 2500, received[:body]["amount_cents"]
    assert_equal users(:one).email, received[:body]["email"]
    assert_equal "Project Funding", received[:body]["purpose"]
    assert_includes received[:body]["instructions"], projects(:one).name
  end

  test "create_card_grant! surfaces HCB's validation messages" do
    with_access_token do
      with_v4_stubs do |stubs|
        stubs.post("/api/v4/organizations/#{HcbService::ORG_SLUG}/card_grants") do
          [ 422, { "Content-Type" => "application/json" }, { error: "invalid_operation", messages: [ "Insufficient funds" ] }.to_json ]
        end

        error = assert_raises(HcbService::Error) { HcbService.create_card_grant!(direct_grant_order) }
        assert_includes error.message, "Insufficient funds"
        assert_includes error.message, "422"
      end
    end
  end

  test "create_card_grant! refuses orders without a dollar amount before calling HCB" do
    order = Order.new(user: users(:one), kind: "shop_item", shop_item: ShopItem.new(name: "Thing", coin_cost: 1), coin_cost: 1)

    with_access_token do
      with_v4_stubs do
        assert_raises(HcbService::Error) { HcbService.create_card_grant!(order) }
      end
    end
  end

  test "shop item grant amount multiplies the internal price by quantity" do
    item = ShopItem.new(name: "Thing", coin_cost: 1, internal_price_usd: 12.5)
    order = Order.new(user: users(:one), kind: "shop_item", shop_item: item, coin_cost: 2, quantity: 2)

    assert_equal 25.0, order.grant_amount_usd
    assert_equal 2500, order.grant_amount_cents
  end

  test "access_token raises when HCB isn't connected" do
    assert_raises(HcbService::Error) { HcbService.access_token }
  end

  test "access_token returns the stored token while it is fresh" do
    AppSetting.set(HcbService::REFRESH_TOKEN_SETTING, "refresh")
    AppSetting.set(HcbService::ACCESS_TOKEN_SETTING, "fresh")
    AppSetting.set(HcbService::EXPIRES_AT_SETTING, 1.hour.from_now.iso8601)

    with_v4_stubs do
      assert_equal "fresh", HcbService.access_token
    end
  end

  test "access_token refreshes an expired token and stores the new pair" do
    AppSetting.set(HcbService::REFRESH_TOKEN_SETTING, "old-refresh")
    AppSetting.set(HcbService::ACCESS_TOKEN_SETTING, "stale")
    AppSetting.set(HcbService::EXPIRES_AT_SETTING, 1.minute.ago.iso8601)
    received = nil

    with_v4_stubs do |stubs|
      stubs.post("/api/v4/oauth/token") do |env|
        received = JSON.parse(env.body)
        json(access_token: "new-access", refresh_token: "new-refresh", expires_in: 7200, token_type: "Bearer")
      end

      assert_equal "new-access", HcbService.access_token
    end

    assert_equal "refresh_token", received["grant_type"]
    assert_equal "old-refresh", received["refresh_token"]
    assert_equal "new-access", AppSetting.get(HcbService::ACCESS_TOKEN_SETTING)
    assert_equal "new-refresh", AppSetting.get(HcbService::REFRESH_TOKEN_SETTING)
    assert Time.zone.parse(AppSetting.get(HcbService::EXPIRES_AT_SETTING)) > 1.hour.from_now
  end

  test "a revoked refresh token asks for a reconnect" do
    AppSetting.set(HcbService::REFRESH_TOKEN_SETTING, "revoked")
    AppSetting.set(HcbService::EXPIRES_AT_SETTING, 1.minute.ago.iso8601)

    with_v4_stubs do |stubs|
      stubs.post("/api/v4/oauth/token") do
        [ 400, { "Content-Type" => "application/json" }, { error: "invalid_grant" }.to_json ]
      end

      error = assert_raises(HcbService::Error) { HcbService.access_token }
      assert_includes error.message, "reconnect"
    end
  end

  test "connection_status reports a disconnected state" do
    status = HcbService.connection_status

    assert_equal false, status[:connected]
    assert_nil status[:account_email]
    assert_equal HcbService::ORG_SLUG, status[:org_slug]
  end
end
