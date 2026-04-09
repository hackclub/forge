class HomeController < ApplicationController
  def index
    projects = current_user.projects.kept.order(updated_at: :desc).to_a
    news_posts = NewsPost.includes(:author).published.limit(3)

    render inertia: "Home/Index", props: {
      user: {
        display_name: current_user.display_name,
        email: current_user.email,
        avatar: current_user.avatar,
        created_at: current_user.created_at.strftime("%B %d, %Y")
      },
      stats: {
        projects_count: projects.size
      },
      projects: projects.map { |p|
        {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle,
          status: p.status,
          cover_image_url: p.cover_image_url,
          updated_at: p.updated_at.strftime("%b %d, %Y")
        }
      },
      news_posts: news_posts.map { |post|
        {
          id: post.id,
          title: post.title,
          body: post.body,
          published_at: post.published_at.strftime("%b %d, %Y"),
          author_name: post.author.display_name
        }
      }
    }
  end
end
