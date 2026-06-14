require "test_helper"

class ImpersonationsControllerTest < ActionDispatch::IntegrationTest
  def make_user(attrs = {})
    token = SecureRandom.hex(6)
    User.create!({
      avatar: "avatar",
      display_name: "User #{token}",
      email: "#{token}@example.com",
      timezone: "UTC",
      slack_id: "S#{token}",
      hca_id: "H#{token}",
      roles: [ "user" ]
    }.merge(attrs))
  end

  def admin_with_users_permission
    make_user(roles: [ "admin" ], permissions: [ "users" ])
  end

  def sign_in_as(user)
    original = User.method(:exchange_hca_token)
    User.define_singleton_method(:exchange_hca_token) { |*_| user }
    get hca_callback_path, params: { code: "x" }
  ensure
    User.define_singleton_method(:exchange_hca_token, original)
  end

  test "user-admin can start and stop impersonating a non-staff user" do
    admin = admin_with_users_permission
    target = make_user
    sign_in_as(admin)

    assert_difference -> { AuditEvent.where(action: "user.impersonation_started").count }, 1 do
      post impersonate_path(target)
    end
    assert_equal target.id, session[:user_id]
    assert_equal admin.id, session[:impersonator_id]

    assert_difference -> { AuditEvent.where(action: "user.impersonation_stopped").count }, 1 do
      delete stop_impersonating_path
    end
    assert_equal admin.id, session[:user_id]
    assert_nil session[:impersonator_id]
  end

  test "spending the user's coins is blocked while impersonating" do
    admin = admin_with_users_permission
    target = make_user
    sign_in_as(admin)
    post impersonate_path(target)

    assert_no_difference -> { Order.count } do
      post shop_orders_path, params: { kind: "direct_grant", amount_usd: 5 }, headers: { "Accept" => "application/json" }
    end
    assert_response :forbidden
    assert_equal target.id, session[:user_id]
    assert_equal admin.id, session[:impersonator_id]
  end

  test "non-money actions are allowed while impersonating" do
    admin = admin_with_users_permission
    target = make_user
    sign_in_as(admin)
    post impersonate_path(target)

    patch shop_region_path, params: { region: "us" }
    assert_not_equal 403, response.status
  end

  test "cannot impersonate staff members" do
    admin = admin_with_users_permission
    staff = make_user(roles: [ "reviewer" ])
    sign_in_as(admin)

    post impersonate_path(staff)
    assert_nil session[:impersonator_id]
    assert_equal admin.id, session[:user_id]
  end

  test "cannot impersonate yourself" do
    admin = admin_with_users_permission
    sign_in_as(admin)

    post impersonate_path(admin)
    assert_nil session[:impersonator_id]
  end

  test "users without the users permission cannot impersonate" do
    nobody = make_user
    target = make_user
    sign_in_as(nobody)

    post impersonate_path(target)
    assert_response :not_found
    assert_nil session[:impersonator_id]
  end
end
