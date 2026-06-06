class ExploreController < ApplicationController
  include ExploreFeedProps

  allow_unauthenticated_access

  def index
    render inertia: "Explore/Index", props: explore_feed_props
  end
end
