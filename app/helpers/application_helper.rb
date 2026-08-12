module ApplicationHelper
  GOOGLE_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&family=Space+Grotesk:wght@300;400;500;600;700&display=swap".freeze

  def google_fonts_tags
    safe_join([
      tag.link(rel: "preconnect", href: "https://fonts.googleapis.com"),
      tag.link(rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous"),
      tag.link(rel: "preload", as: "style", href: GOOGLE_FONTS_HREF),
      tag.link(rel: "stylesheet", href: GOOGLE_FONTS_HREF, media: "print", onload: "this.media='all'"),
      tag.noscript(tag.link(rel: "stylesheet", href: GOOGLE_FONTS_HREF))
    ], "\n")
  end

  def safe_url(url)
    return nil if url.blank?

    uri = URI.parse(url)
    uri.scheme&.match?(/\Ahttps?\z/i) ? url : nil
  rescue URI::InvalidURIError
    nil
  end
end
