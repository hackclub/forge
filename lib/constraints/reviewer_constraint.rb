class ReviewerConstraint
  def matches?(request)
    user_id = request.session[:user_id]
    return false unless user_id

    user = User.find_by(id: user_id)
    user&.reviewer?
  end
end
