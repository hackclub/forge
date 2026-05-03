# == Route Map
#
# Routes for application:
#                                   Prefix Verb   URI Pattern                                                                                       Controller#Action
#                                          GET    /(*path)(.:format)                                                                                redirect(301) {host: "127.0.0.1"}
#                               admin_root GET    /admin(.:format)                                                                                  admin/static_pages#index
#                            admin_pitches GET    /admin/pitches(.:format)                                                                          admin/projects#pitches
#                            admin_reviews GET    /admin/reviews(.:format)                                                                          admin/projects#reviews
#                     review_admin_project POST   /admin/projects/:id/review(.:format)                                                              admin/projects#review
#                    restore_admin_project POST   /admin/projects/:id/restore(.:format)                                                             admin/projects#restore
#              toggle_hidden_admin_project POST   /admin/projects/:id/toggle_hidden(.:format)                                                       admin/projects#toggle_hidden
#          toggle_staff_pick_admin_project POST   /admin/projects/:id/toggle_staff_pick(.:format)                                                   admin/projects#toggle_staff_pick
#                change_tier_admin_project POST   /admin/projects/:id/change_tier(.:format)                                                         admin/projects#change_tier
#                   add_note_admin_project POST   /admin/projects/:id/add_note(.:format)                                                            admin/projects#add_note
#               destroy_note_admin_project DELETE /admin/projects/:id/notes/:note_id(.:format)                                                      admin/projects#destroy_note
#                           admin_projects GET    /admin/projects(.:format)                                                                         admin/projects#index
#                            admin_project GET    /admin/projects/:id(.:format)                                                                     admin/projects#show
#                                          DELETE /admin/projects/:id(.:format)                                                                     admin/projects#destroy
#                  update_roles_admin_user PATCH  /admin/users/:id/update_roles(.:format)                                                           admin/users#update_roles
#            update_permissions_admin_user PATCH  /admin/users/:id/update_permissions(.:format)                                                     admin/users#update_permissions
#                       restore_admin_user POST   /admin/users/:id/restore(.:format)                                                                admin/users#restore
#                           ban_admin_user POST   /admin/users/:id/ban(.:format)                                                                    admin/users#ban
#                         unban_admin_user POST   /admin/users/:id/unban(.:format)                                                                  admin/users#unban
#                      add_note_admin_user POST   /admin/users/:id/add_note(.:format)                                                               admin/users#add_note
#                  destroy_note_admin_user DELETE /admin/users/:id/notes/:note_id(.:format)                                                         admin/users#destroy_note
#                      add_kudo_admin_user POST   /admin/users/:id/add_kudo(.:format)                                                               admin/users#add_kudo
#                  destroy_kudo_admin_user DELETE /admin/users/:id/kudos/:kudo_id(.:format)                                                         admin/users#destroy_kudo
#                  adjust_coins_admin_user POST   /admin/users/:id/adjust_coins(.:format)                                                           admin/users#adjust_coins
#                  coin_history_admin_user GET    /admin/users/:id/coin_history(.:format)                                                           admin/users#coin_history
#          toggle_shop_unlocked_admin_user POST   /admin/users/:id/toggle_shop_unlocked(.:format)                                                   admin/users#toggle_shop_unlocked
#     toggle_maintenance_bypass_admin_user POST   /admin/users/:id/toggle_maintenance_bypass(.:format)                                              admin/users#toggle_maintenance_bypass
#        generate_referral_code_admin_user POST   /admin/users/:id/generate_referral_code(.:format)                                                 admin/users#generate_referral_code
#    update_fulfillment_regions_admin_user PATCH  /admin/users/:id/update_fulfillment_regions(.:format)                                             admin/users#update_fulfillment_regions
#                              admin_users GET    /admin/users(.:format)                                                                            admin/users#index
#                               admin_user GET    /admin/users/:id(.:format)                                                                        admin/users#show
#                                          DELETE /admin/users/:id(.:format)                                                                        admin/users#destroy
#                toggle_admin_feature_flag POST   /admin/feature_flags/:id/toggle(.:format)                                                         admin/feature_flags#toggle
#                      admin_feature_flags GET    /admin/feature_flags(.:format)                                                                    admin/feature_flags#index
#                                          POST   /admin/feature_flags(.:format)                                                                    admin/feature_flags#create
#                       admin_feature_flag DELETE /admin/feature_flags/:id(.:format)                                                                admin/feature_flags#destroy
#                   toggle_admin_news_post POST   /admin/news_posts/:id/toggle(.:format)                                                            admin/news_posts#toggle
#                         admin_news_posts GET    /admin/news_posts(.:format)                                                                       admin/news_posts#index
#                                          POST   /admin/news_posts(.:format)                                                                       admin/news_posts#create
#                          admin_news_post PATCH  /admin/news_posts/:id(.:format)                                                                   admin/news_posts#update
#                                          PUT    /admin/news_posts/:id(.:format)                                                                   admin/news_posts#update
#                                          DELETE /admin/news_posts/:id(.:format)                                                                   admin/news_posts#destroy
#                      approve_admin_order POST   /admin/orders/:id/approve(.:format)                                                               admin/orders#approve
#                       reject_admin_order POST   /admin/orders/:id/reject(.:format)                                                                admin/orders#reject
#                      fulfill_admin_order POST   /admin/orders/:id/fulfill(.:format)                                                               admin/orders#fulfill
#                     reassign_admin_order POST   /admin/orders/:id/reassign(.:format)                                                              admin/orders#reassign
#                             admin_orders GET    /admin/orders(.:format)                                                                           admin/orders#index
#                              admin_order GET    /admin/orders/:id(.:format)                                                                       admin/orders#show
#                         admin_shop_items GET    /admin/shop_items(.:format)                                                                       admin/shop_items#index
#                                          POST   /admin/shop_items(.:format)                                                                       admin/shop_items#create
#                          admin_shop_item PATCH  /admin/shop_items/:id(.:format)                                                                   admin/shop_items#update
#                                          PUT    /admin/shop_items/:id(.:format)                                                                   admin/shop_items#update
#                                          DELETE /admin/shop_items/:id(.:format)                                                                   admin/shop_items#destroy
#                       export_admin_rsvps GET    /admin/rsvps/export(.:format)                                                                     admin/rsvps#export
#                              admin_rsvps GET    /admin/rsvps(.:format)                                                                            admin/rsvps#index
#                               admin_rsvp DELETE /admin/rsvps/:id(.:format)                                                                        admin/rsvps#destroy
#               approve_all_admin_referral POST   /admin/referrals/:id/approve_all(.:format)                                                        admin/referrals#approve_all
#              approve_one_admin_referrals POST   /admin/referrals/approve/:referral_id(.:format)                                                   admin/referrals#approve_one
#        force_approve_all_admin_referrals POST   /admin/referrals/force_approve_all(.:format)                                                      admin/referrals#force_approve_all
#              draw_winner_admin_referrals POST   /admin/referrals/draw_winner(.:format)                                                            admin/referrals#draw_winner
#               reset_pool_admin_referrals POST   /admin/referrals/reset_pool(.:format)                                                             admin/referrals#reset_pool
#                          admin_referrals GET    /admin/referrals(.:format)                                                                        admin/referrals#index
#                           admin_referral GET    /admin/referrals/:id(.:format)                                                                    admin/referrals#show
#    send_to_airtable_admin_airtable_queue POST   /admin/airtable_queue/:id/send_to_airtable(.:format)                                              admin/airtable_queue#send_to_airtable
#              cancel_admin_airtable_queue POST   /admin/airtable_queue/:id/cancel(.:format)                                                        admin/airtable_queue#cancel
#               admin_airtable_queue_index GET    /admin/airtable_queue(.:format)                                                                   admin/airtable_queue#index
#                     admin_airtable_queue GET    /admin/airtable_queue/:id(.:format)                                                               admin/airtable_queue#show
#                            admin_metrics GET    /admin/metrics(.:format)                                                                          admin/metrics#index
#                          admin_audit_log GET    /admin/audit_log(.:format)                                                                        admin/audit_log#index
#                    admin_audit_log_entry GET    /admin/audit_log/:id(.:format)                                                                    admin/audit_log#show
#                           admin_database GET    /admin/database(.:format)                                                                         admin/database#index
#                     admin_database_query POST   /admin/database/query(.:format)                                                                   admin/database#query
#               reply_admin_support_ticket POST   /admin/support/:id/reply(.:format)                                                                admin/support_tickets#reply
#               claim_admin_support_ticket POST   /admin/support/:id/claim(.:format)                                                                admin/support_tickets#claim
#             resolve_admin_support_ticket POST   /admin/support/:id/resolve(.:format)                                                              admin/support_tickets#resolve
#                    admin_support_tickets GET    /admin/support(.:format)                                                                          admin/support_tickets#index
#                     admin_support_ticket GET    /admin/support/:id(.:format)                                                                      admin/support_tickets#show
#                                          DELETE /admin/support/:id(.:format)                                                                      admin/support_tickets#destroy
#                     mission_control_jobs        /admin/jobs                                                                                       MissionControl::Jobs::Engine
#                             slack_events POST   /slack/events(.:format)                                                                           slack/events#create
#                      slack_interactivity POST   /slack/interactivity(.:format)                                                                    slack/interactivity#create
#                       rails_health_check GET    /up(.:format)                                                                                     rails/health#show
#                                     root GET    /                                                                                                 landing#index
#                                   signin GET    /signin(.:format)                                                                                 auth#show
#                                hca_start GET    /auth/hca/start(.:format)                                                                         auth#new
#                             hca_callback GET    /auth/hca/callback(.:format)                                                                      auth#create
#                                  signout DELETE /auth/signout(.:format)                                                                           auth#destroy
#                                    sorry GET    /sorry(.:format)                                                                                  bans#show
#                                     home GET    /home(.:format)                                                                                   home#index
#                                 settings GET    /settings(.:format)                                                                               settings#show
#                             sync_address POST   /profile/sync_address(.:format)                                                                   profile#sync_address
#                                     rsvp GET    /rsvp(.:format)                                                                                   rsvps#index
#                                          POST   /rsvp(.:format)                                                                                   rsvps#create
#                            rsvp_referral GET    /rsvp/referral(.:format)                                                                          rsvps#referral
#                                  explore GET    /explore(.:format)                                                                                explore#index
#                              leaderboard GET    /leaderboard(.:format)                                                                            leaderboard#index
#                                referrals GET    /referrals(.:format)                                                                              referrals#index
#                                     shop GET    /shop(.:format)                                                                                   shop#index
#                              shop_orders POST   /shop/orders(.:format)                                                                            shop#create
#                              shop_region PATCH  /shop/region(.:format)                                                                            shop#update_region
#                                     user GET    /users/:id(.:format)                                                                              users#show
#                               user_kudos POST   /users/:id/kudos(.:format)                                                                        users#add_kudo
#                                user_kudo DELETE /users/:id/kudos/:kudo_id(.:format)                                                               users#destroy_kudo
#                              user_github PATCH  /users/:id/github(.:format)                                                                       users#update_github
#                                     news GET    /news(.:format)                                                                                   news#index
#                                news_post GET    /news/:id(.:format)                                                                               news#show
#              import_from_github_projects POST   /projects/import_from_github(.:format)                                                            projects#import_from_github
#                submit_for_review_project POST   /projects/:id/submit_for_review(.:format)                                                         projects#submit_for_review
#                     sync_journal_project POST   /projects/:id/sync_journal(.:format)                                                              projects#sync_journal
#                   export_devlogs_project GET    /projects/:id/export_devlogs(.:format)                                                            projects#export_devlogs
#                   resubmit_pitch_project POST   /projects/:id/resubmit_pitch(.:format)                                                            projects#resubmit_pitch
#               upload_cover_image_project POST   /projects/:id/upload_cover_image(.:format)                                                        projects#upload_cover_image
#                  set_devlog_mode_project PATCH  /projects/:id/set_devlog_mode(.:format)                                                           projects#set_devlog_mode
#                        link_repo_project PATCH  /projects/:id/link_repo(.:format)                                                                 projects#link_repo
#                       mark_built_project POST   /projects/:id/mark_built(.:format)                                                                projects#mark_built
#                         add_kudo_project POST   /projects/:id/add_kudo(.:format)                                                                  projects#add_kudo
#                     destroy_kudo_project DELETE /projects/:id/kudos/:kudo_id(.:format)                                                            projects#destroy_kudo
#                          project_devlogs POST   /projects/:project_id/devlogs(.:format)                                                           devlogs#create
#                           project_devlog GET    /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#show
#                                          PATCH  /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#update
#                                          PUT    /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#update
#                                          DELETE /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#destroy
#                     project_devlog_image POST   /projects/:project_id/devlog_image(.:format)                                                      devlogs#upload_image
#                                 projects POST   /projects(.:format)                                                                               projects#create
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
#                              api_v1_user GET    /api/v1/users/:id(.:format)                                                                       api/v1/users#show
#                                                 /*path(.:format)                                                                                  errors#not_found
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
          post :add_badge
          delete "badges/:badge_id" => "users#destroy_badge", as: :destroy_badge
          post :adjust_coins
          get :coin_history
          post :toggle_shop_unlocked
          post :toggle_maintenance_bypass
          post :generate_referral_code
          patch :update_fulfillment_regions
        end
      end
      resources :feature_flags, only: [ :index, :create, :destroy ] do
        member do
          post :toggle
        end
      end
      resources :reel_payouts, only: [ :index ] do
        member do
          post :approve
          post :reject
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
          post :force_approve_all
          post :draw_winner
          post :reset_pool
        end
      end
      resources :airtable_queue, only: [ :index, :show ] do
        member do
          post :send_to_airtable
          post :cancel
          post :retry
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
  post "onboarding/complete" => "onboarding#complete", as: :complete_onboarding
  post "onboarding/restart" => "onboarding#restart", as: :restart_onboarding
  post "forge_keeper/chat" => "forge_keeper#chat", as: :forge_keeper_chat
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

  get "feed" => "feed#index", as: :feed
  resources :reels, only: [ :edit, :update, :destroy ] do
    resource :kudo, only: [ :create, :destroy ], module: :reels, controller: "kudos"
    resource :view, only: [ :create ], module: :reels, controller: "views"
    resources :comments, only: [ :index, :create, :destroy ], module: :reels
  end

  resources :projects, except: :index do
    collection do
      post :import_from_github
    end
    member do
      post :submit_for_review
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
    resources :devlogs, only: [ :show, :create, :update, :destroy ]
    post "devlog_image" => "devlogs#upload_image", as: :devlog_image
    resources :reels, only: [ :index, :new, :create ]
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
