module ApplicationHelper
  TEXT_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap".freeze

  ICON_FONT_HREF = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block".freeze

  # Used to stylize the "Macondo" wordmark on the Import from Macondo button.
  DISPLAY_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Are+You+Serious&display=swap".freeze

  def google_fonts_tags
    safe_join([
      tag.link(rel: "preconnect", href: "https://fonts.googleapis.com"),
      tag.link(rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous"),
      tag.link(rel: "stylesheet", href: TEXT_FONTS_HREF),
      tag.link(rel: "stylesheet", href: ICON_FONT_HREF),
      tag.link(rel: "stylesheet", href: DISPLAY_FONTS_HREF)
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
