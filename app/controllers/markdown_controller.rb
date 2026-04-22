class MarkdownController < ApplicationController
  allow_unauthenticated_access only: %i[show]

  def show
    slug = params[:slug].to_s
    slug = "index" if slug.blank?
    not_found unless valid_slug?(slug)

    base = Rails.root.join("docs")
    candidates = if slug == "index"
      [ base.join("index.md") ]
    else
      [ base.join("#{slug}.md"), base.join(slug, "index.md") ]
    end

    path = candidates.find { |p| File.exist?(p.to_s) }
    not_found unless path
    not_found unless File.expand_path(path).start_with?(File.expand_path(base))

    content_html = helpers.render_markdown_file(path)
    file_meta = helpers.guide_metadata_for(path)
    meta = helpers.docs_meta_for_url("/docs#{slug == 'index' ? '' : "/#{slug}"}")
    page_title = meta&.dig(:title).presence || file_meta[:title].presence || slug.tr("-_/", " ").split.map(&:capitalize).join(" ")

    render inertia: "Markdown/Show", props: {
      content_html: content_html,
      page_title: page_title,
      sidebar_tree: helpers.docs_sidebar_tree,
      current_path: "/docs#{slug == 'index' ? '' : "/#{slug}"}"
    }
  end

  private

  def valid_slug?(slug)
    return true if slug == "index"
    return false if slug.blank?
    return false if slug.include?("..") || slug.start_with?("/") || slug.include?("\\")

    slug.each_char.all? { |char| char.ord >= 32 && char.ord != 127 }
  end

  def not_found
    raise ActionController::RoutingError, "Not Found"
  end
end
