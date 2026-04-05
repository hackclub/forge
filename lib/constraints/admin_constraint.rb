class AdminConstraint
  def matches?(request)
    user_id = request.session[:user_id]
    return false unless user_id

    user = Rails.cache.fetch("user/#{user_id}", expires_in: 5.minutes) do
      User.find_by(id: user_id)
    end
    user&.admin?
  end
end
