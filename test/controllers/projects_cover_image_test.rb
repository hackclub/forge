require "test_helper"

class ProjectsCoverImageTest < ActionDispatch::IntegrationTest
  setup do
    token = SecureRandom.hex(6)
    @user = User.create!(
      avatar: "avatar",
      display_name: "User #{token}",
      email: "#{token}@example.com",
      timezone: "UTC",
      slack_id: "S#{token}",
      hca_id: "H#{token}",
      roles: [ "user" ],
      birthday: 20.years.ago.to_date,
      onboarded_at: Time.current,
      guild: :rivendell
    )
    @project = Project.create!(user: @user, name: "Cover Test", tier: "tier_4", status: :draft)
    sign_in_as(@user)
  end

  def sign_in_as(user)
    original = User.method(:exchange_hca_token)
    User.define_singleton_method(:exchange_hca_token) { |*_| user }
    get hca_callback_path, params: { code: "x" }
  ensure
    User.define_singleton_method(:exchange_hca_token, original)
  end

  def upload(bytes, filename:, content_type:)
    file = Tempfile.new([ "cover", File.extname(filename) ])
    file.binmode
    file.write(bytes)
    file.rewind
    post upload_cover_image_project_path(@project),
         params: { cover_image: Rack::Test::UploadedFile.new(file.path, content_type, true, original_filename: filename) }
  ensure
    file&.close!
  end

  test "rejects files that aren't images" do
    upload("%PDF-1.4\n", filename: "cover.pdf", content_type: "application/pdf")

    assert_redirected_to project_path(@project)
    assert_match(/PNG, JPEG or WebP/, flash[:alert])
    assert_not @project.reload.cover_image.attached?
  end

  test "rejects a non-image renamed to look like one" do
    upload("%PDF-1.4\n", filename: "cover.png", content_type: "image/png")

    assert_match(/PNG, JPEG or WebP/, flash[:alert])
    assert_not @project.reload.cover_image.attached?
  end

  test "rejects images over 10 MB" do
    upload("\x89PNG\r\n\x1a\n".b + ("0" * ProjectsController::MAX_COVER_IMAGE_BYTES), filename: "cover.png", content_type: "image/png")

    assert_match(/10 MB or smaller/, flash[:alert])
    assert_not @project.reload.cover_image.attached?
  end
end
