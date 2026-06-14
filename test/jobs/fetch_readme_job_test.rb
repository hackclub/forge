require "test_helper"

class FetchReadmeJobTest < ActiveSupport::TestCase
  def with_cdn(enabled:, mirror:)
    orig_enabled = HcCdnService.method(:enabled?)
    orig_mirror = HcCdnService.method(:mirror)
    HcCdnService.define_singleton_method(:enabled?) { enabled }
    HcCdnService.define_singleton_method(:mirror) { |url| mirror.call(url) }
    yield
  ensure
    HcCdnService.define_singleton_method(:enabled?, orig_enabled)
    HcCdnService.define_singleton_method(:mirror, orig_mirror)
  end

  test "upload_images_to_cdn caps how many images it mirrors in one pass" do
    job = FetchReadmeJob.new
    calls = 0
    over_cap = FetchReadmeJob::MAX_MIRRORED_IMAGES + 15
    markdown = (1..over_cap).map { |i| "![pic](https://example.com/#{i}.png)" }.join("\n")

    result = with_cdn(enabled: true, mirror: ->(_url) { calls += 1; "https://cdn.hackclub.com/x.png" }) do
      job.send(:upload_images_to_cdn, markdown)
    end

    assert_equal FetchReadmeJob::MAX_MIRRORED_IMAGES, calls, "should stop mirroring past the cap"
    assert_includes result, "https://example.com/#{FetchReadmeJob::MAX_MIRRORED_IMAGES + 1}.png"
  end

  test "upload_images_to_cdn falls back to the original url when mirroring fails" do
    job = FetchReadmeJob.new
    result = with_cdn(enabled: true, mirror: ->(_url) { nil }) do
      job.send(:upload_images_to_cdn, "![pic](https://example.com/a.png)")
    end
    assert_equal "![pic](https://example.com/a.png)", result
  end

  test "upload_images_to_cdn is a no-op when the CDN is disabled" do
    job = FetchReadmeJob.new
    markdown = "![pic](https://example.com/a.png)"
    result = with_cdn(enabled: false, mirror: ->(_url) { flunk("must not mirror when disabled") }) do
      job.send(:upload_images_to_cdn, markdown)
    end
    assert_equal markdown, result
  end
end
