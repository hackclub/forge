require "test_helper"

# The checks added to stop Forge repeating fines from #this-is-fines.
class ForgeChecksFineGuardsTest < ActiveSupport::TestCase
  setup do
    Rails.cache.clear
    @project = projects(:one)
  end

  def ctx = ForgeChecks::Context.new(@project.reload)

  # --- Cover image: 97 fines, 2 of them ours -------------------------------

  test "rejects an animated cover image" do
    %w[gif apng webm mp4 mov].each do |ext|
      @project.update_columns(cover_image_url: "https://cdn.example.com/cover.#{ext}")
      result = ForgeChecks::CoverImageIsStill.call(ctx)
      assert_equal "fail", result.verdict, "expected .#{ext} to fail"
    end
  end

  test "rejects a cover image that is not an image at all" do
    @project.update_columns(cover_image_url: "https://cdn.example.com/order-form.pdf")
    assert_equal "fail", ForgeChecks::CoverImageIsStill.call(ctx).verdict
  end

  test "accepts a still photo" do
    @project.update_columns(cover_image_url: "https://cdn.example.com/cover.png")
    assert_equal "pass", ForgeChecks::CoverImageIsStill.call(ctx).verdict
  end

  test "fails when there is no cover image" do
    @project.update_columns(cover_image_url: nil)
    assert_equal "fail", ForgeChecks::CoverImageIsStill.call(ctx).verdict
  end

  # --- Build proof link: 73 fines, 7 of them ours --------------------------

  test "rejects link shapes that were fined without making a request" do
    {
      "http://localhost:3000/demo" => "localhost",
      "https://drive.google.com/file/d/abc" => "Google Drive",
      "https://myapp.streamlit.app" => "Streamlit",
      "https://cad.onshape.com/documents/abc" => "Onshape",
      "file:///Users/me/demo.html" => "file path",
      "https://example.com/demo.mov" => "raw video"
    }.each do |url, label|
      @project.update_columns(build_proof_url: url)
      result = ForgeChecks::PlayableUrlReachable.call(ctx)
      assert_equal "fail", result.verdict, "expected #{label} (#{url}) to fail"
    end
  end

  test "skips when no build proof link is set" do
    @project.update_columns(build_proof_url: nil)
    assert_equal "skipped", ForgeChecks::PlayableUrlReachable.call(ctx).verdict
  end

  # --- School and paid work: ineligible outright --------------------------

  test "flags a submission whose own README calls it a school project" do
    @project.update_columns(readme_cache: "# Thing\n\nThis is my grade 11 capstone project for school.")
    result = ForgeChecks::NotSchoolOrPaidWork.call(ctx)
    assert_equal "fail", result.verdict
    assert_match(/capstone/i, result.reasoning)
  end

  test "flags paid Hack Club work" do
    @project.update_columns(readme_cache: "Built this as part of my internship at Hack Club.")
    assert_equal "fail", ForgeChecks::NotSchoolOrPaidWork.call(ctx).verdict
  end

  test "passes an ordinary README" do
    @project.update_columns(readme_cache: "# Keyboard\n\nA 60% split keyboard with a custom PCB.")
    assert_equal "pass", ForgeChecks::NotSchoolOrPaidWork.call(ctx).verdict
  end

  test "does not trip on the word class in a code sense" do
    @project.update_columns(readme_cache: "The Keyboard class handles matrix scanning. Best in class latency.")
    assert_equal "pass", ForgeChecks::NotSchoolOrPaidWork.call(ctx).verdict
  end

  # --- Duplicates: the largest fine category ------------------------------

  test "fails when the repo was already approved for someone else" do
    other = projects(:two)
    other.update_columns(repo_link: @project.repo_link, status: Project.statuses[:approved])

    result = ForgeChecks::NoDuplicateSubmission.call(ctx)
    assert_equal "fail", result.verdict
  end

  test "skips when no repo is linked" do
    @project.update_columns(repo_link: nil)
    assert_equal "skipped", ForgeChecks::NoDuplicateSubmission.call(ctx).verdict
  end

  # --- Hardware files: STEP-not-STL, KiCad project files ------------------

  class StubbedTree < ForgeChecks::Context
    def initialize(project, tree)
      super(project)
      @tree = tree
    end

    def supported_repo? = true
    def repo_tree = @tree
  end

  def hardware(tree) = ForgeChecks::HardwareFilesModifiable.call(StubbedTree.new(@project, tree))

  test "fails a repo with meshes but no editable CAD source" do
    result = hardware(%w[case.stl lid.stl README.md])
    assert_equal "fail", result.verdict
    assert_match(/STEP/i, result.reasoning)
  end

  # A wiring diagram is included in these two so the CAD rule is what is under
  # test rather than the separate no-PCB-no-diagram rule.
  test "passes a repo with editable CAD alongside the meshes" do
    assert_equal "pass", hardware(%w[case.step case.stl docs/wiring.png]).verdict
  end

  test "is uncertain when only some parts have an editable source" do
    result = hardware(%w[case.step case.stl lid.stl base.stl docs/wiring.png])
    assert_equal "uncertain", result.verdict
    assert_match(/editable source/i, result.reasoning)
  end

  test "fails a repo with gerbers but no PCB project files" do
    result = hardware(%w[gerbers/top.gtl gerbers/bottom.gbl case.step])
    assert_equal "fail", result.verdict
    assert_match(/kicad/i, result.reasoning)
  end

  test "passes gerbers accompanied by the KiCad project" do
    assert_equal "pass", hardware(%w[board.kicad_pcb board.kicad_sch gerbers/top.gtl case.step]).verdict
  end

  test "asks for a wiring diagram when there is no PCB at all" do
    result = hardware(%w[case.step firmware/main.c])
    assert_equal "uncertain", result.verdict
    assert_match(/wiring/i, result.reasoning)
  end

  test "accepts a wiring diagram in the repo" do
    assert_equal "pass", hardware(%w[case.step docs/wiring-diagram.png]).verdict
  end

  test "accepts a wiring diagram described in the README" do
    @project.update_columns(readme_cache: "## Wiring\n\nConnect D2 to the switch matrix.")
    assert_equal "pass", hardware(%w[case.step]).verdict
  end
end
