require "csv"

class Admin::RsvpsController < Admin::ApplicationController
  before_action :require_admin!

  def index
    scope = Rsvp.order(created_at: :desc)
    scope = scope.where("email ILIKE ?", "%#{params[:query]}%") if params[:query].present?
    @pagy, @rsvps = pagy(scope, limit: 100)

    render inertia: "Admin/Rsvps/Index", props: {
      rsvps: @rsvps.map { |r|
        {
          id: r.id,
          email: r.email,
          created_at: r.created_at.strftime("%b %d, %Y %H:%M")
        }
      },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      total: Rsvp.count
    }
  end

  def destroy
    rsvp = Rsvp.find(params[:id])
    email = rsvp.email
    rsvp.destroy
    redirect_to admin_rsvps_path, notice: "Removed #{email}."
  end

  def export
    csv = CSV.generate do |out|
      out << %w[email created_at]
      Rsvp.order(created_at: :desc).find_each do |r|
        out << [ r.email, r.created_at.iso8601 ]
      end
    end

    send_data csv, filename: "forge-rsvps-#{Date.current}.csv", type: "text/csv"
  end
end
