require "test_helper"

class Admin::OrdersCreateGrantTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  def make_user(attrs = {})
    token = SecureRandom.hex(6)
    User.create!({
      avatar: "avatar", display_name: "User #{token}", email: "#{token}@example.com",
      timezone: "UTC", slack_id: "S#{token}", hca_id: "H#{token}", roles: [ "user" ]
    }.merge(attrs))
  end

  def sign_in_as(user)
    original = User.method(:exchange_hca_token)
    User.define_singleton_method(:exchange_hca_token) { |*_| user }
    get hca_callback_path, params: { code: "x" }, headers: { "REMOTE_ADDR" => unique_ip }
    assert_equal 302, response.status, "sign-in failed (#{response.status}) — rate limited?"
  ensure
    User.define_singleton_method(:exchange_hca_token, original)
  end

  def unique_ip
    @@ip_counter = (defined?(@@ip_counter) ? @@ip_counter : 0) + 1
    "10.#{(@@ip_counter / 65_536) % 256}.#{(@@ip_counter / 256) % 256}.#{@@ip_counter % 256}"
  end

  def with_hcb_grant(result: nil, error: nil)
    calls = []
    original = HcbService.method(:create_card_grant!)
    HcbService.define_singleton_method(:create_card_grant!) do |order|
      calls << order.id
      raise error if error

      result
    end
    yield calls
  ensure
    HcbService.define_singleton_method(:create_card_grant!, original)
  end

  setup do
    Rails.cache.clear
    @staff = make_user(roles: [ "fulfillment" ], permissions: [ "orders" ])
    @project = projects(:one)
    @order = Order.create!(
      user: @project.user, project: @project, kind: "direct_grant",
      amount_usd: 25, coin_cost: 25, status: :approved
    )
    sign_in_as(@staff)
  end

  test "creates the grant through HCB and marks the order fulfilled" do
    grant = { id: "cdg_x9", link: "https://hcb.hackclub.com/grants/x9", status: "active", amount_cents: 2500 }

    with_hcb_grant(result: grant) do |calls|
      assert_enqueued_with(job: FulfillmentNotifyJob, args: [ @order.id ]) do
        post create_grant_admin_order_path(@order)
      end

      assert_redirected_to admin_order_path(@order)
      assert_equal [ @order.id ], calls
    end

    @order.reload
    assert @order.fulfilled?
    assert_equal "https://hcb.hackclub.com/grants/x9", @order.hcb_grant_link
    assert_nil @order.fulfillment_method
    assert_equal @staff, @order.reviewer
    assert_not_nil @order.fulfilled_at

    audit = AuditEvent.where(action: "order.fulfilled").order(:created_at).last
    assert_equal "hcb_api", audit.metadata["via"]
    assert_equal "cdg_x9", audit.metadata["hcb_card_grant_id"]
  end

  test "leaves the order approved and shows HCB's error when the grant fails" do
    with_hcb_grant(error: HcbService::Error.new("HCB request failed (422): Insufficient funds")) do
      post create_grant_admin_order_path(@order)
    end

    assert_redirected_to admin_order_path(@order)
    assert_equal "HCB request failed (422): Insufficient funds", flash[:alert]

    @order.reload
    assert @order.approved?
    assert_nil @order.hcb_grant_link
  end

  test "refuses to grant an order that isn't approved" do
    @order.update!(status: :pending)

    with_hcb_grant(result: {}) do |calls|
      post create_grant_admin_order_path(@order)
      assert_empty calls
    end

    assert_redirected_to admin_order_path(@order)
    assert @order.reload.pending?
  end

  test "refuses to grant an order twice" do
    @order.update!(status: :fulfilled, hcb_grant_link: "https://hcb.hackclub.com/grants/first", fulfilled_at: Time.current)

    with_hcb_grant(result: {}) do |calls|
      post create_grant_admin_order_path(@order)
      assert_empty calls
    end

    assert_equal "https://hcb.hackclub.com/grants/first", @order.reload.hcb_grant_link
  end

  test "requires the orders permission" do
    sign_in_as(make_user(roles: [ "reviewer" ], permissions: [ "projects" ]))

    with_hcb_grant(result: {}) do |calls|
      post create_grant_admin_order_path(@order)
      assert_empty calls
    end

    assert_equal 404, response.status
    assert @order.reload.approved?
  end
end
