module ApplicationHelper
  def safe_url(url)
    return nil if url.blank?

    uri = URI.parse(url)
    uri.scheme&.match?(/\Ahttps?\z/i) ? url : nil
  rescue URI::InvalidURIError
    nil
  end
end
