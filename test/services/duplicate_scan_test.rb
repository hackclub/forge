require "test_helper"

class DuplicateScanTest < ActiveSupport::TestCase
  setup do
    Rails.cache.clear
    @project = projects(:one)
  end

  # The test environment uses :null_store, so caching behaviour is invisible
  # unless a real store is swapped in for the duration of the assertion.
  def with_memory_cache
    original = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    yield
  ensure
    Rails.cache = original
  end

  # Swaps module functions for the duration of a block, matching the pattern the
  # admin controller tests already use.
  def with_unified(records_for_repo:, enabled: true)
    originals = {
      records_for_repo: UnifiedDbService.method(:records_for_repo),
      enabled?: UnifiedDbService.method(:enabled?)
    }
    UnifiedDbService.define_singleton_method(:records_for_repo) { |*args, **kw| records_for_repo.call(*args, **kw) }
    UnifiedDbService.define_singleton_method(:enabled?) { enabled }
    yield
  ensure
    originals.each { |name, m| UnifiedDbService.define_singleton_method(name, m) }
  end

  test "normalises repo URLs to an owner/repo slug" do
    expected = "example/one"
    [
      "https://github.com/example/one",
      "https://github.com/Example/One",
      "https://github.com/example/one.git",
      "https://github.com/example/one/",
      "https://github.com/example/one/tree/main",
      "http://github.com/example/one?tab=readme"
    ].each do |url|
      assert_equal expected, UnifiedDbService.repo_slug(url), "failed for #{url}"
    end
  end

  test "ignores URLs that are not a repo" do
    assert_nil UnifiedDbService.repo_slug("https://example.com/thing")
    assert_nil UnifiedDbService.repo_slug(nil)
    assert_nil UnifiedDbService.repo_slug("")
  end

  test "reports clear when no other project shares the repo" do
    scan = DuplicateScan.run(@project)
    assert_equal "clear", scan["verdict"]
    assert_empty scan["forge"]
  end

  test "skips projects with no repo linked" do
    @project.update_columns(repo_link: nil)
    scan = DuplicateScan.run(@project)
    assert_nil scan["slug"]
    assert_equal "clear", scan["verdict"]
  end

  # The four Forge fines for duplicates were all repos submitted by a *different*
  # builder to another program, so a different owner on an approved project is
  # the shape that has to block.
  test "blocks when another builder already had the same repo approved" do
    other = projects(:two)
    other.update_columns(repo_link: @project.repo_link, status: Project.statuses[:approved])

    scan = DuplicateScan.run(@project)
    assert_equal "blocked", scan["verdict"]
    assert_equal 1, scan["forge"].size
    assert_not scan["forge"].first["same_owner"]
  end

  test "only asks for a look when the same builder has the repo elsewhere" do
    other = projects(:two)
    other.update_columns(repo_link: @project.repo_link, user_id: @project.user_id)

    scan = DuplicateScan.run(@project)
    assert_equal "review", scan["verdict"]
    assert scan["forge"].first["same_owner"]
  end

  # A design ship and its build ship legitimately share a repo.
  test "does not flag a project's own build review counterpart" do
    build = projects(:two)
    build.update_columns(
      repo_link: @project.repo_link,
      user_id: @project.user_id,
      build_review: true,
      linked_project_id: @project.id
    )

    scan = DuplicateScan.run(build)
    assert_equal "clear", scan["verdict"]
    assert_empty scan["forge"]
  end

  test "a near-miss slug is not a duplicate" do
    other = projects(:two)
    other.update_columns(repo_link: "https://github.com/example/one-fork")

    scan = DuplicateScan.run(@project)
    assert_equal "clear", scan["verdict"]
  end

  test "says so when the Unified DB lookup is not configured" do
    scan = DuplicateScan.run(@project)
    assert_equal UnifiedDbService.enabled?, scan["unified_available"]
  end

  # A transient Airtable outage must not be remembered as "no duplicates" — the
  # whole point of the scan is that it does not miss one.
  test "a failed unified lookup is reported and never cached" do
    calls = 0
    failing = ->(*) { calls += 1; raise UnifiedDbService::LookupError, "boom" }

    with_memory_cache do
      with_unified(records_for_repo: failing) do
        first = DuplicateScan.run(@project)
        assert first["unified_error"]
        assert_empty first["unified"]

        DuplicateScan.run(@project)
      end
    end

    assert_equal 2, calls, "expected the failed lookup to be retried, not served from cache"
  end

  test "a successful lookup is cached" do
    calls = 0
    succeeding = ->(*) { calls += 1; [] }

    with_memory_cache do
      with_unified(records_for_repo: succeeding) do
        first = DuplicateScan.run(@project)
        assert_not first["unified_error"]

        DuplicateScan.run(@project)
      end
    end

    assert_equal 1, calls, "expected the second call to be served from cache"
  end

  # Setting the token has to take effect on the next page load, not 30 minutes
  # later. A scan taken while it was unset used to be cached as a clean result.
  test "a scan taken before the token was configured is not cached" do
    calls = 0
    counting = ->(*) { calls += 1; [] }

    with_memory_cache do
      with_unified(records_for_repo: counting, enabled: false) do
        first = DuplicateScan.run(@project)
        assert_not first["unified_checked"]
        assert_not first["unified_available"]
      end

      # Token now configured; the next load must re-scan rather than serve the
      # "not configured" answer from cache.
      with_unified(records_for_repo: counting) do
        second = DuplicateScan.run(@project)
        assert second["unified_checked"], "expected a fresh scan once the token exists"
      end
    end

    # Two calls, not one: the second load re-scanned instead of returning the
    # cached "not configured" result. (The stub bypasses the real enabled?
    # short-circuit, so the disabled pass counts as a call too.)
    assert_equal 2, calls, "expected the second load to re-scan, not hit cache"
  end

  test "a unified match blocks regardless of what Forge holds" do
    match = ->(*) {
      [ { "record_id" => "rec1", "record_url" => "https://airtable.com/x", "program" => "Blueprint",
          "status" => "Approved", "hours" => 8, "submitter" => "Someone", "email" => nil,
          "code_url" => @project.repo_link, "created_at" => nil } ]
    }

    with_unified(records_for_repo: match) do
      scan = DuplicateScan.run(@project)
      assert_equal "blocked", scan["verdict"]
      assert_equal "Blueprint", scan["unified"].first["program"]
    end
  end
end
