# == Route Map
#
# Routes for application:
#                                   Prefix Verb   URI Pattern                                                                                       Controller#Action
#                                          GET    /(*path)(.:format)                                                                                redirect(301) {host: "127.0.0.1"}
#                               admin_root GET    /admin(.:format)                                                                                  admin/static_pages#index
#                              admin_ships GET    /admin/reviews(.:format)                                                                          admin/ships#index
#                          edit_admin_ship GET    /admin/reviews/:id/edit(.:format)                                                                 admin/ships#edit
#                               admin_ship GET    /admin/reviews/:id(.:format)                                                                      admin/ships#show
#                                          PATCH  /admin/reviews/:id(.:format)                                                                      admin/ships#update
#                                          PUT    /admin/reviews/:id(.:format)                                                                      admin/ships#update
#                     mission_control_jobs        /jobs                                                                                             MissionControl::Jobs::Engine
#                           admin_projects GET    /admin/projects(.:format)                                                                         admin/projects#index
#                            admin_project GET    /admin/projects/:id(.:format)                                                                     admin/projects#show
#                              admin_users GET    /admin/users(.:format)                                                                            admin/users#index
#                               admin_user GET    /admin/users/:id(.:format)                                                                        admin/users#show
#                       rails_health_check GET    /up(.:format)                                                                                     rails/health#show
#                                     root GET    /                                                                                                 landing#index
#                                   signin GET    /auth/hca/start(.:format)                                                                         auth#new
#                             hca_callback GET    /auth/hca/callback(.:format)                                                                      auth#create
#                                  signout DELETE /auth/signout(.:format)                                                                           auth#destroy
#                                    sorry GET    /sorry(.:format)                                                                                  bans#show
#                                     home GET    /home(.:format)                                                                                   home#index
#                                 projects GET    /projects(.:format)                                                                               projects#index
#                                          POST   /projects(.:format)                                                                               projects#create
#                              new_project GET    /projects/new(.:format)                                                                           projects#new
#                             edit_project GET    /projects/:id/edit(.:format)                                                                      projects#edit
#                                  project GET    /projects/:id(.:format)                                                                           projects#show
#                                          PATCH  /projects/:id(.:format)                                                                           projects#update
#                                          PUT    /projects/:id(.:format)                                                                           projects#update
#                                          DELETE /projects/:id(.:format)                                                                           projects#destroy
#                                     docs GET    /docs(.:format)                                                                                   markdown#show
#                                      doc GET    /docs/*slug(.:format)                                                                             markdown#show
#                          api_v1_projects GET    /api/v1/projects(.:format)                                                                        api/v1/projects#index
#                           api_v1_project GET    /api/v1/projects/:id(.:format)                                                                    api/v1/projects#show
#         turbo_recede_historical_location GET    /recede_historical_location(.:format)                                                             turbo/native/navigation#recede
#         turbo_resume_historical_location GET    /resume_historical_location(.:format)                                                             turbo/native/navigation#resume
#        turbo_refresh_historical_location GET    /refresh_historical_location(.:format)                                                            turbo/native/navigation#refresh
#            rails_postmark_inbound_emails POST   /rails/action_mailbox/postmark/inbound_emails(.:format)                                           action_mailbox/ingresses/postmark/inbound_emails#create
#               rails_relay_inbound_emails POST   /rails/action_mailbox/relay/inbound_emails(.:format)                                              action_mailbox/ingresses/relay/inbound_emails#create
#            rails_sendgrid_inbound_emails POST   /rails/action_mailbox/sendgrid/inbound_emails(.:format)                                           action_mailbox/ingresses/sendgrid/inbound_emails#create
#      rails_mandrill_inbound_health_check GET    /rails/action_mailbox/mandrill/inbound_emails(.:format)                                           action_mailbox/ingresses/mandrill/inbound_emails#health_check
#            rails_mandrill_inbound_emails POST   /rails/action_mailbox/mandrill/inbound_emails(.:format)                                           action_mailbox/ingresses/mandrill/inbound_emails#create
#             rails_mailgun_inbound_emails POST   /rails/action_mailbox/mailgun/inbound_emails/mime(.:format)                                       action_mailbox/ingresses/mailgun/inbound_emails#create
#           rails_conductor_inbound_emails GET    /rails/conductor/action_mailbox/inbound_emails(.:format)                                          rails/conductor/action_mailbox/inbound_emails#index
#                                          POST   /rails/conductor/action_mailbox/inbound_emails(.:format)                                          rails/conductor/action_mailbox/inbound_emails#create
#        new_rails_conductor_inbound_email GET    /rails/conductor/action_mailbox/inbound_emails/new(.:format)                                      rails/conductor/action_mailbox/inbound_emails#new
#            rails_conductor_inbound_email GET    /rails/conductor/action_mailbox/inbound_emails/:id(.:format)                                      rails/conductor/action_mailbox/inbound_emails#show
# new_rails_conductor_inbound_email_source GET    /rails/conductor/action_mailbox/inbound_emails/sources/new(.:format)                              rails/conductor/action_mailbox/inbound_emails/sources#new
#    rails_conductor_inbound_email_sources POST   /rails/conductor/action_mailbox/inbound_emails/sources(.:format)                                  rails/conductor/action_mailbox/inbound_emails/sources#create
#    rails_conductor_inbound_email_reroute POST   /rails/conductor/action_mailbox/:inbound_email_id/reroute(.:format)                               rails/conductor/action_mailbox/reroutes#create
# rails_conductor_inbound_email_incinerate POST   /rails/conductor/action_mailbox/:inbound_email_id/incinerate(.:format)                            rails/conductor/action_mailbox/incinerates#create
#                       rails_service_blob GET    /rails/active_storage/blobs/redirect/:signed_id/*filename(.:format)                               active_storage/blobs/redirect#show
#                 rails_service_blob_proxy GET    /rails/active_storage/blobs/proxy/:signed_id/*filename(.:format)                                  active_storage/blobs/proxy#show
#                                          GET    /rails/active_storage/blobs/:signed_id/*filename(.:format)                                        active_storage/blobs/redirect#show
#                rails_blob_representation GET    /rails/active_storage/representations/redirect/:signed_blob_id/:variation_key/*filename(.:format) active_storage/representations/redirect#show
#          rails_blob_representation_proxy GET    /rails/active_storage/representations/proxy/:signed_blob_id/:variation_key/*filename(.:format)    active_storage/representations/proxy#show
#                                          GET    /rails/active_storage/representations/:signed_blob_id/:variation_key/*filename(.:format)          active_storage/representations/redirect#show
#                       rails_disk_service GET    /rails/active_storage/disk/:encoded_key/*filename(.:format)                                       active_storage/disk#show
#                update_rails_disk_service PUT    /rails/active_storage/disk/:encoded_token(.:format)                                               active_storage/disk#update
#                     rails_direct_uploads POST   /rails/active_storage/direct_uploads(.:format)                                                    active_storage/direct_uploads#create
#
# Routes for MissionControl::Jobs::Engine:
#                      Prefix Verb   URI Pattern                                                    Controller#Action
#     application_queue_pause DELETE /applications/:application_id/queues/:queue_id/pause(.:format) mission_control/jobs/queues/pauses#destroy
#                             POST   /applications/:application_id/queues/:queue_id/pause(.:format) mission_control/jobs/queues/pauses#create
#          application_queues GET    /applications/:application_id/queues(.:format)                 mission_control/jobs/queues#index
#           application_queue GET    /applications/:application_id/queues/:id(.:format)             mission_control/jobs/queues#show
#       application_job_retry POST   /applications/:application_id/jobs/:job_id/retry(.:format)     mission_control/jobs/retries#create
#     application_job_discard POST   /applications/:application_id/jobs/:job_id/discard(.:format)   mission_control/jobs/discards#create
#    application_job_dispatch POST   /applications/:application_id/jobs/:job_id/dispatch(.:format)  mission_control/jobs/dispatches#create
#    application_bulk_retries POST   /applications/:application_id/jobs/bulk_retries(.:format)      mission_control/jobs/bulk_retries#create
#   application_bulk_discards POST   /applications/:application_id/jobs/bulk_discards(.:format)     mission_control/jobs/bulk_discards#create
#             application_job GET    /applications/:application_id/jobs/:id(.:format)               mission_control/jobs/jobs#show
#            application_jobs GET    /applications/:application_id/:status/jobs(.:format)           mission_control/jobs/jobs#index
#         application_workers GET    /applications/:application_id/workers(.:format)                mission_control/jobs/workers#index
#          application_worker GET    /applications/:application_id/workers/:id(.:format)            mission_control/jobs/workers#show
# application_recurring_tasks GET    /applications/:application_id/recurring_tasks(.:format)        mission_control/jobs/recurring_tasks#index
#  application_recurring_task GET    /applications/:application_id/recurring_tasks/:id(.:format)    mission_control/jobs/recurring_tasks#show
#                             PATCH  /applications/:application_id/recurring_tasks/:id(.:format)    mission_control/jobs/recurring_tasks#update
#                             PUT    /applications/:application_id/recurring_tasks/:id(.:format)    mission_control/jobs/recurring_tasks#update
#                      queues GET    /queues(.:format)                                              mission_control/jobs/queues#index
#                       queue GET    /queues/:id(.:format)                                          mission_control/jobs/queues#show
#                         job GET    /jobs/:id(.:format)                                            mission_control/jobs/jobs#show
#                        jobs GET    /:status/jobs(.:format)                                        mission_control/jobs/jobs#index
#                        root GET    /                                                              mission_control/jobs/queues#index

require_relative "../lib/constraints/staff_constraint"
require_relative "../lib/constraints/admin_constraint"
require_relative "../lib/constraints/reviewer_constraint"

Rails.application.routes.draw do
  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end
  constraints StaffConstraint.new do
    namespace :admin do
      get "/" => "static_pages#index", as: :root
      get "pitches" => "projects#pitches", as: :pitches
      get "reviews" => "projects#reviews", as: :reviews

      resources :projects, only: [ :index, :show, :destroy ] do
        member do
          post :review
          post :restore
          post :toggle_hidden
          post :toggle_staff_pick
          post :change_tier
          post :review_devlog
          post :add_note
          delete "notes/:note_id" => "projects#destroy_note", as: :destroy_note
        end
      end
      resources :users, only: [ :index, :show, :destroy ] do
        member do
          patch :update_roles
          patch :update_permissions
          post :restore
          post :ban
          post :unban
          post :add_note
          delete "notes/:note_id" => "users#destroy_note", as: :destroy_note
          post :add_kudo
          delete "kudos/:kudo_id" => "users#destroy_kudo", as: :destroy_kudo
          post :adjust_coins
          get :coin_history
          post :toggle_shop_unlocked
          post :generate_referral_code
          patch :update_fulfillment_regions
        end
      end
      resources :feature_flags, only: [ :index, :create, :destroy ] do
        member do
          post :toggle
        end
      end
      resources :news_posts, only: [ :index, :create, :update, :destroy ] do
        member do
          post :toggle
        end
      end
      resources :orders, only: [ :index, :show ] do
        member do
          post :approve
          post :reject
          post :fulfill
          post :reassign
        end
      end
      resources :shop_items, only: [ :index, :create, :update, :destroy ]
      resources :rsvps, only: [ :index, :destroy ] do
        collection do
          get :export
        end
      end
      resources :referrals, only: [ :index, :show ] do
        member do
          post :approve_all
        end
        collection do
          post "approve/:referral_id" => "referrals#approve_one", as: :approve_one
          post :draw_winner
          post :reset_pool
        end
      end
      resources :airtable_queue, only: [ :index, :show ] do
        member do
          post :send_to_airtable
          post :cancel
        end
      end
      get "metrics" => "metrics#index", as: :metrics
      get "audit_log" => "audit_log#index", as: :audit_log
      get "audit_log/:id" => "audit_log#show", as: :audit_log_entry
      get "database" => "database#index", as: :database
      post "database/query" => "database#query"
      resources :support_tickets, only: [ :index, :show, :destroy ], path: "support" do
        member do
          post :reply
          post :claim
          post :resolve
        end
      end
    end
  end

  constraints AdminConstraint.new do
    mount MissionControl::Jobs::Engine, at: "/admin/jobs"
  end

  post "slack/events" => "slack/events#create"
  post "slack/interactivity" => "slack/interactivity#create"

  get "up" => "rails/health#show", as: :rails_health_check

  root "landing#index"

  get "signin" => "auth#show", as: :signin
  get "auth/hca/start" => "auth#new", as: :hca_start
  get "auth/hca/callback" => "auth#create", as: :hca_callback
  delete "auth/signout" => "auth#destroy", as: :signout

  get "sorry" => "bans#show", as: :sorry

  get "home" => "home#index", as: :home
  get "settings" => "settings#show", as: :settings
  post "profile/sync_address" => "profile#sync_address", as: :sync_address
  get "rsvp" => "rsvps#index", as: :rsvp
  post "rsvp" => "rsvps#create"
  get "rsvp/referral" => "rsvps#referral", as: :rsvp_referral

  get "explore" => "explore#index", as: :explore
  get "leaderboard" => "leaderboard#index", as: :leaderboard
  get "referrals" => "referrals#index", as: :referrals
  get "shop" => "shop#index", as: :shop
  post "shop/orders" => "shop#create", as: :shop_orders
  patch "shop/region" => "shop#update_region", as: :shop_region
  get "users/:id" => "users#show", as: :user
  post "users/:id/kudos" => "users#add_kudo", as: :user_kudos
  delete "users/:id/kudos/:kudo_id" => "users#destroy_kudo", as: :user_kudo
  patch "users/:id/github" => "users#update_github", as: :user_github
  get "news" => "news#index", as: :news
  get "news/:id" => "news#show", as: :news_post

  resources :projects, except: :index do
    collection do
      post :import_from_github
    end
    member do
      post :submit_for_review
      post :finish_project
      post :sync_journal
      get :export_devlogs
      post :resubmit_pitch
      post :upload_cover_image
      patch :set_devlog_mode
      patch :link_repo
      post :mark_built
      post :add_kudo
      delete "kudos/:kudo_id" => "projects#destroy_kudo", as: :destroy_kudo
    end
    resources :devlogs, only: [ :create, :update, :destroy ] do
      member do
        post :submit_for_review
      end
    end
    post "devlog_image" => "devlogs#upload_image", as: :devlog_image
  end

  get "docs" => "markdown#show", as: :docs
  get "docs/*slug" => "markdown#show", as: :doc

  namespace :api do
    namespace :v1 do
      resources :projects, only: [ :index, :show ]
      resources :users, only: [ :show ]
    end
  end

  match "*path", to: "errors#not_found", via: :all, constraints: ->(req) { !req.path.start_with?("/rails/") }
end
