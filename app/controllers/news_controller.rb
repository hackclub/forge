class NewsController < ApplicationController
  def index
    posts = NewsPost.includes(:author).published

    render inertia: "News/Index", props: {
      posts: posts.map do |post|
        {
          id: post.id,
          title: post.title,
          body: post.body,
          published_at: post.published_at.strftime("%b %d, %Y"),
          author_name: post.author.display_name
        }
      end
    }
  end
end
