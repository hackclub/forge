# == Route Map
#
# Routes for application:
#                                     Prefix Verb   URI Pattern                                                                                       Controller#Action
#                                            GET    /(*path)(.:format)                                                                                redirect(301) {host: "127.0.0.1"}
#                                 admin_root GET    /admin(.:format)                                                                                  admin/static_pages#index
#                              admin_pitches GET    /admin/pitches(.:format)                                                                          admin/projects#pitches
#                              admin_reviews GET    /admin/reviews(.:format)                                                                          admin/reviews#index
#                         admin_tier_reviews GET    /admin/reviews/:tier(.:format)                                                                    admin/reviews#index {tier: /t[1-4]/}
#                  admin_reviews_leaderboard GET    /admin/reviews/leaderboard(.:format)                                                              admin/reviews#leaderboard
#                 admin_requirements_reviews GET    /admin/reviews/requirements(.:format)                                                             admin/reviews#requirements
#                      admin_flagged_reviews GET    /admin/reviews/flagged(.:format)                                                                  admin/reviews#flagged
#                               admin_review GET    /admin/reviews/:id(.:format)                                                                      admin/reviews#show
#                          admin_skip_review POST   /admin/reviews/:id/skip(.:format)                                                                 admin/reviews#skip
#                         admin_track_review POST   /admin/reviews/:id/track(.:format)                                                                admin/reviews#track
#                         admin_claim_review POST   /admin/reviews/:id/claim(.:format)                                                                admin/reviews#claim
#             heartbeat_admin_review_session PATCH  /admin/review_sessions/:id/heartbeat(.:format)                                                    admin/review_sessions#heartbeat
#               release_admin_review_session POST   /admin/review_sessions/:id/release(.:format)                                                      admin/review_sessions#release
#                       review_admin_project POST   /admin/projects/:id/review(.:format)                                                              admin/projects#review
#                      restore_admin_project POST   /admin/projects/:id/restore(.:format)                                                             admin/projects#restore
#                toggle_hidden_admin_project POST   /admin/projects/:id/toggle_hidden(.:format)                                                       admin/projects#toggle_hidden
#            toggle_shadow_ban_admin_project POST   /admin/projects/:id/toggle_shadow_ban(.:format)                                                   admin/projects#toggle_shadow_ban
#            toggle_staff_pick_admin_project POST   /admin/projects/:id/toggle_staff_pick(.:format)                                                   admin/projects#toggle_staff_pick
#                  change_tier_admin_project POST   /admin/projects/:id/change_tier(.:format)                                                         admin/projects#change_tier
#          convert_review_type_admin_project POST   /admin/projects/:id/convert_review_type(.:format)                                                 admin/projects#convert_review_type
#                     add_note_admin_project POST   /admin/projects/:id/add_note(.:format)                                                            admin/projects#add_note
#                 mark_unbuilt_admin_project POST   /admin/projects/:id/mark_unbuilt(.:format)                                                        admin/projects#mark_unbuilt
#               reverse_review_admin_project POST   /admin/projects/:id/reverse_review(.:format)                                                      admin/projects#reverse_review
#        ai_requirements_check_admin_project POST   /admin/projects/:id/ai_requirements_check(.:format)                                               admin/projects#ai_requirements_check
# ai_requirements_check_status_admin_project GET    /admin/projects/:id/ai_requirements_check_status(.:format)                                        admin/projects#ai_requirements_check_status
#                    repo_tree_admin_project GET    /admin/projects/:id/repo_tree(.:format)                                                           admin/projects#repo_tree
#                 commit_stats_admin_project GET    /admin/projects/:id/commit_stats(.:format)                                                        admin/projects#commit_stats
#         changes_since_review_admin_project GET    /admin/projects/:id/changes_since_review(.:format)                                                admin/projects#changes_since_review
#      send_checkpoint_message_admin_project POST   /admin/projects/:id/send_checkpoint_message(.:format)                                             admin/projects#send_checkpoint_message
#              send_dm_message_admin_project POST   /admin/projects/:id/send_dm_message(.:format)                                                     admin/projects#send_dm_message
#                 destroy_note_admin_project DELETE /admin/projects/:id/notes/:note_id(.:format)                                                      admin/projects#destroy_note
#                  update_note_admin_project PATCH  /admin/projects/:id/notes/:note_id(.:format)                                                      admin/projects#update_note
#              flag_for_review_admin_project POST   /admin/projects/:id/flag_for_review(.:format)                                                     admin/projects#flag_for_review
#            unflag_for_review_admin_project POST   /admin/projects/:id/unflag_for_review(.:format)                                                   admin/projects#unflag_for_review
#                             admin_projects GET    /admin/projects(.:format)                                                                         admin/projects#index
#                              admin_project GET    /admin/projects/:id(.:format)                                                                     admin/projects#show
#                                            DELETE /admin/projects/:id(.:format)                                                                     admin/projects#destroy
#                    update_roles_admin_user PATCH  /admin/users/:id/update_roles(.:format)                                                           admin/users#update_roles
#              update_permissions_admin_user PATCH  /admin/users/:id/update_permissions(.:format)                                                     admin/users#update_permissions
#                    update_guild_admin_user PATCH  /admin/users/:id/update_guild(.:format)                                                           admin/users#update_guild
#                         restore_admin_user POST   /admin/users/:id/restore(.:format)                                                                admin/users#restore
#                             ban_admin_user POST   /admin/users/:id/ban(.:format)                                                                    admin/users#ban
#                           unban_admin_user POST   /admin/users/:id/unban(.:format)                                                                  admin/users#unban
#                        add_note_admin_user POST   /admin/users/:id/add_note(.:format)                                                               admin/users#add_note
#                    destroy_note_admin_user DELETE /admin/users/:id/notes/:note_id(.:format)                                                         admin/users#destroy_note
#                        add_kudo_admin_user POST   /admin/users/:id/add_kudo(.:format)                                                               admin/users#add_kudo
#                    destroy_kudo_admin_user DELETE /admin/users/:id/kudos/:kudo_id(.:format)                                                         admin/users#destroy_kudo
#                       add_badge_admin_user POST   /admin/users/:id/add_badge(.:format)                                                              admin/users#add_badge
#                   destroy_badge_admin_user DELETE /admin/users/:id/badges/:badge_id(.:format)                                                       admin/users#destroy_badge
#                    adjust_coins_admin_user POST   /admin/users/:id/adjust_coins(.:format)                                                           admin/users#adjust_coins
#                   adjust_streak_admin_user POST   /admin/users/:id/adjust_streak(.:format)                                                          admin/users#adjust_streak
#                    coin_history_admin_user GET    /admin/users/:id/coin_history(.:format)                                                           admin/users#coin_history
#            toggle_shop_unlocked_admin_user POST   /admin/users/:id/toggle_shop_unlocked(.:format)                                                   admin/users#toggle_shop_unlocked
#       toggle_maintenance_bypass_admin_user POST   /admin/users/:id/toggle_maintenance_bypass(.:format)                                              admin/users#toggle_maintenance_bypass
#               toggle_bypass_idv_admin_user POST   /admin/users/:id/toggle_bypass_idv(.:format)                                                      admin/users#toggle_bypass_idv
#                        sync_idv_admin_user POST   /admin/users/:id/sync_idv(.:format)                                                               admin/users#sync_idv
#          generate_referral_code_admin_user POST   /admin/users/:id/generate_referral_code(.:format)                                                 admin/users#generate_referral_code
#      update_fulfillment_regions_admin_user PATCH  /admin/users/:id/update_fulfillment_regions(.:format)                                             admin/users#update_fulfillment_regions
#                                admin_users GET    /admin/users(.:format)                                                                            admin/users#index
#                                 admin_user GET    /admin/users/:id(.:format)                                                                        admin/users#show
#                                            DELETE /admin/users/:id(.:format)                                                                        admin/users#destroy
#                  toggle_admin_feature_flag POST   /admin/feature_flags/:id/toggle(.:format)                                                         admin/feature_flags#toggle
#                        admin_feature_flags GET    /admin/feature_flags(.:format)                                                                    admin/feature_flags#index
#                                            POST   /admin/feature_flags(.:format)                                                                    admin/feature_flags#create
#                         admin_feature_flag DELETE /admin/feature_flags/:id(.:format)                                                                admin/feature_flags#destroy
#              payout_all_admin_reel_payouts POST   /admin/reel_payouts/payout_all(.:format)                                                          admin/reel_payouts#payout_all
#                  approve_admin_reel_payout POST   /admin/reel_payouts/:id/approve(.:format)                                                         admin/reel_payouts#approve
#                   reject_admin_reel_payout POST   /admin/reel_payouts/:id/reject(.:format)                                                          admin/reel_payouts#reject
#                         admin_reel_payouts GET    /admin/reel_payouts(.:format)                                                                     admin/reel_payouts#index
#                       toggle_admin_reel_ad POST   /admin/reel_ads/:id/toggle(.:format)                                                              admin/reel_ads#toggle
#                             admin_reel_ads GET    /admin/reel_ads(.:format)                                                                         admin/reel_ads#index
#                                            POST   /admin/reel_ads(.:format)                                                                         admin/reel_ads#create
#                              admin_reel_ad PATCH  /admin/reel_ads/:id(.:format)                                                                     admin/reel_ads#update
#                                            PUT    /admin/reel_ads/:id(.:format)                                                                     admin/reel_ads#update
#                                            DELETE /admin/reel_ads/:id(.:format)                                                                     admin/reel_ads#destroy
#                        approve_admin_order POST   /admin/orders/:id/approve(.:format)                                                               admin/orders#approve
#                         reject_admin_order POST   /admin/orders/:id/reject(.:format)                                                                admin/orders#reject
#                        fulfill_admin_order POST   /admin/orders/:id/fulfill(.:format)                                                               admin/orders#fulfill
#                       reassign_admin_order POST   /admin/orders/:id/reassign(.:format)                                                              admin/orders#reassign
#                               admin_orders GET    /admin/orders(.:format)                                                                           admin/orders#index
#                                admin_order GET    /admin/orders/:id(.:format)                                                                       admin/orders#show
#                           admin_shop_items GET    /admin/shop_items(.:format)                                                                       admin/shop_items#index
#                                            POST   /admin/shop_items(.:format)                                                                       admin/shop_items#create
#                            admin_shop_item PATCH  /admin/shop_items/:id(.:format)                                                                   admin/shop_items#update
#                                            PUT    /admin/shop_items/:id(.:format)                                                                   admin/shop_items#update
#                                            DELETE /admin/shop_items/:id(.:format)                                                                   admin/shop_items#destroy
#                         export_admin_rsvps GET    /admin/rsvps/export(.:format)                                                                     admin/rsvps#export
#                                admin_rsvps GET    /admin/rsvps(.:format)                                                                            admin/rsvps#index
#                                 admin_rsvp DELETE /admin/rsvps/:id(.:format)                                                                        admin/rsvps#destroy
#                 approve_all_admin_referral POST   /admin/referrals/:id/approve_all(.:format)                                                        admin/referrals#approve_all
#                approve_one_admin_referrals POST   /admin/referrals/approve/:referral_id(.:format)                                                   admin/referrals#approve_one
#          force_approve_all_admin_referrals POST   /admin/referrals/force_approve_all(.:format)                                                      admin/referrals#force_approve_all
#                draw_winner_admin_referrals POST   /admin/referrals/draw_winner(.:format)                                                            admin/referrals#draw_winner
#                 reset_pool_admin_referrals POST   /admin/referrals/reset_pool(.:format)                                                             admin/referrals#reset_pool
#                            admin_referrals GET    /admin/referrals(.:format)                                                                        admin/referrals#index
#                             admin_referral GET    /admin/referrals/:id(.:format)                                                                    admin/referrals#show
#      send_to_airtable_admin_airtable_queue POST   /admin/airtable_queue/:id/send_to_airtable(.:format)                                              admin/airtable_queue#send_to_airtable
#                cancel_admin_airtable_queue POST   /admin/airtable_queue/:id/cancel(.:format)                                                        admin/airtable_queue#cancel
#                 retry_admin_airtable_queue POST   /admin/airtable_queue/:id/retry(.:format)                                                         admin/airtable_queue#retry
#        revert_project_admin_airtable_queue POST   /admin/airtable_queue/:id/revert_project(.:format)                                                admin/airtable_queue#revert_project
#             send_back_admin_airtable_queue POST   /admin/airtable_queue/:id/send_back(.:format)                                                     admin/airtable_queue#send_back
#   check_justification_admin_airtable_queue POST   /admin/airtable_queue/:id/check_justification(.:format)                                           admin/airtable_queue#check_justification
#                 admin_airtable_queue_index GET    /admin/airtable_queue(.:format)                                                                   admin/airtable_queue#index
#                       admin_airtable_queue GET    /admin/airtable_queue/:id(.:format)                                                               admin/airtable_queue#show
#               refresh_admin_hackatime_bans POST   /admin/hackatime_bans/refresh(.:format)                                                           admin/hackatime_bans#refresh
#               ban_all_admin_hackatime_bans POST   /admin/hackatime_bans/ban_all(.:format)                                                           admin/hackatime_bans#ban_all
#                       admin_hackatime_bans GET    /admin/hackatime_bans(.:format)                                                                   admin/hackatime_bans#index
#                              admin_metrics GET    /admin/metrics(.:format)                                                                          admin/metrics#index
#                        admin_airtable_sync GET    /admin/airtable_sync(.:format)                                                                    admin/airtable_sync#index
#                admin_airtable_sync_recheck POST   /admin/airtable_sync/recheck(.:format)                                                            admin/airtable_sync#recheck
#                admin_airtable_sync_requeue POST   /admin/airtable_sync/requeue/:project_id(.:format)                                                admin/airtable_sync#requeue
#                          admin_slack_pings GET    /admin/slack_pings(.:format)                                                                      admin/slack_pings#index
#              admin_slack_pings_weekly_ping POST   /admin/slack_pings/weekly_ping(.:format)                                                          admin/slack_pings#weekly_ping
#              admin_slack_pings_leaderboard POST   /admin/slack_pings/leaderboard(.:format)                                                          admin/slack_pings#leaderboard
#            admin_slack_pings_streak_breaks POST   /admin/slack_pings/streak_breaks(.:format)                                                        admin/slack_pings#streak_breaks
#                  admin_slack_pings_invites POST   /admin/slack_pings/invites(.:format)                                                              admin/slack_pings#invites
#                        admin_review_audits GET    /admin/review_audits(.:format)                                                                    admin/review_audits#index
#                         admin_review_audit GET    /admin/review_audits/:id(.:format)                                                                admin/review_audits#show
#                            admin_audit_log GET    /admin/audit_log(.:format)                                                                        admin/audit_log#index
#                      admin_audit_log_entry GET    /admin/audit_log/:id(.:format)                                                                    admin/audit_log#show
#                             admin_database GET    /admin/database(.:format)                                                                         admin/database#index
#                       admin_database_query POST   /admin/database/query(.:format)                                                                   admin/database#query
#                             admin_api_keys GET    /admin/api_keys(.:format)                                                                         admin/api_keys#index
#                              admin_api_key POST   /admin/api_keys/:id(.:format)                                                                     admin/api_keys#update
#                         admin_api_key_test POST   /admin/api_keys/:id/test(.:format)                                                                admin/api_keys#test
#                                      admin DELETE /admin/api_keys/:id(.:format)                                                                     admin/api_keys#destroy
#                 reply_admin_support_ticket POST   /admin/support/:id/reply(.:format)                                                                admin/support_tickets#reply
#                 claim_admin_support_ticket POST   /admin/support/:id/claim(.:format)                                                                admin/support_tickets#claim
#               resolve_admin_support_ticket POST   /admin/support/:id/resolve(.:format)                                                              admin/support_tickets#resolve
#                      admin_support_tickets GET    /admin/support(.:format)                                                                          admin/support_tickets#index
#                       admin_support_ticket GET    /admin/support/:id(.:format)                                                                      admin/support_tickets#show
#                                            DELETE /admin/support/:id(.:format)                                                                      admin/support_tickets#destroy
#                       mission_control_jobs        /admin/jobs                                                                                       MissionControl::Jobs::Engine
#                               slack_events POST   /slack/events(.:format)                                                                           slack/events#create
#                        slack_interactivity POST   /slack/interactivity(.:format)                                                                    slack/interactivity#create
#                         rails_health_check GET    /up(.:format)                                                                                     rails/health#show
#                                       root GET    /                                                                                                 landing#index
#                                     signin GET    /signin(.:format)                                                                                 auth#show
#                                  hca_start GET    /auth/hca/start(.:format)                                                                         auth#new
#                               hca_callback GET    /auth/hca/callback(.:format)                                                                      auth#create
#                                    signout DELETE /auth/signout(.:format)                                                                           auth#destroy
#                                impersonate POST   /impersonate/:user_id(.:format)                                                                   impersonations#create
#                         stop_impersonating DELETE /impersonate(.:format)                                                                            impersonations#destroy
#                                      sorry GET    /sorry(.:format)                                                                                  bans#show
#                                       home GET    /home(.:format)                                                                                   home#index
#                                   settings GET    /settings(.:format)                                                                               settings#show
#                      settings_avatar_proxy GET    /settings/avatar_proxy(.:format)                                                                  settings#avatar_proxy
#                          settings_timezone PATCH  /settings/timezone(.:format)                                                                      settings#update_timezone
#                        complete_onboarding POST   /onboarding/complete(.:format)                                                                    onboarding#complete
#                         restart_onboarding POST   /onboarding/restart(.:format)                                                                     onboarding#restart
#                          forge_keeper_chat POST   /forge_keeper/chat(.:format)                                                                      forge_keeper#chat
#                               sync_address POST   /profile/sync_address(.:format)                                                                   profile#sync_address
#                                       rsvp GET    /rsvp(.:format)                                                                                   rsvps#index
#                                            POST   /rsvp(.:format)                                                                                   rsvps#create
#                              rsvp_referral GET    /rsvp/referral(.:format)                                                                          rsvps#referral
#                                    explore GET    /explore(.:format)                                                                                explore#index
#                                leaderboard GET    /leaderboard(.:format)                                                                            leaderboard#index
#                                    relight GET    /relight(.:format)                                                                                relight#index
#                                  referrals GET    /referrals(.:format)                                                                              referrals#index
#                                       shop GET    /shop(.:format)                                                                                   shop#index
#                                shop_orders POST   /shop/orders(.:format)                                                                            shop#create
#                                shop_region PATCH  /shop/region(.:format)                                                                            shop#update_region
#                                       user GET    /users/:id(.:format)                                                                              users#show
#                                 user_kudos POST   /users/:id/kudos(.:format)                                                                        users#add_kudo
#                                  user_kudo DELETE /users/:id/kudos/:kudo_id(.:format)                                                               users#destroy_kudo
#                                user_github PATCH  /users/:id/github(.:format)                                                                       users#update_github
#                           new_guild_choice GET    /guilds/choose(.:format)                                                                          guild_choices#new
#                              guild_choices POST   /guilds/choose(.:format)                                                                          guild_choices#create
#                         leaderboard_guilds GET    /guilds/leaderboard(.:format)                                                                     guilds#leaderboard
#                                     guilds GET    /guilds(.:format)                                                                                 guilds#index
#                                      guild GET    /guilds/:id(.:format)                                                                             guilds#show
#                                 reels_feed GET    /reels(.:format)                                                                                  reels#index
#                         reel_ad_impression POST   /reel_ads/:id/impression(.:format)                                                                reel_ads#impression
#                              reel_ad_click POST   /reel_ads/:id/click(.:format)                                                                     reel_ads#click
#                                  reel_kudo DELETE /reels/:reel_id/kudo(.:format)                                                                    reels/kudos#destroy
#                                            POST   /reels/:reel_id/kudo(.:format)                                                                    reels/kudos#create
#                                  reel_view POST   /reels/:reel_id/view(.:format)                                                                    reels/views#create
#                              reel_comments GET    /reels/:reel_id/comments(.:format)                                                                reels/comments#index
#                                            POST   /reels/:reel_id/comments(.:format)                                                                reels/comments#create
#                               reel_comment DELETE /reels/:reel_id/comments/:id(.:format)                                                            reels/comments#destroy
#                                  edit_reel GET    /reels/:id/edit(.:format)                                                                         reels#edit
#                                       reel GET    /reels/:id(.:format)                                                                              reels#show
#                                            PATCH  /reels/:id(.:format)                                                                              reels#update
#                                            PUT    /reels/:id(.:format)                                                                              reels#update
#                                            DELETE /reels/:id(.:format)                                                                              reels#destroy
#                import_from_github_projects POST   /projects/import_from_github(.:format)                                                            projects#import_from_github
#               import_from_macondo_projects POST   /projects/import_from_macondo(.:format)                                                           projects#import_from_macondo
#                hackatime_projects_projects GET    /projects/hackatime_projects(.:format)                                                            projects#hackatime_projects
#                  submit_for_review_project POST   /projects/:id/submit_for_review(.:format)                                                         projects#submit_for_review
#                           ai_check_project GET    /projects/:id/ai_check(.:format)                                                                  projects#ai_check
#                       run_ai_check_project POST   /projects/:id/run_ai_check(.:format)                                                              projects#run_ai_check
#                    ai_check_status_project GET    /projects/:id/ai_check_status(.:format)                                                           projects#ai_check_status
#                       sync_journal_project POST   /projects/:id/sync_journal(.:format)                                                              projects#sync_journal
#                     export_devlogs_project GET    /projects/:id/export_devlogs(.:format)                                                            projects#export_devlogs
#                     resubmit_pitch_project POST   /projects/:id/resubmit_pitch(.:format)                                                            projects#resubmit_pitch
#                 upload_cover_image_project POST   /projects/:id/upload_cover_image(.:format)                                                        projects#upload_cover_image
#                    set_devlog_mode_project PATCH  /projects/:id/set_devlog_mode(.:format)                                                           projects#set_devlog_mode
#                          link_repo_project PATCH  /projects/:id/link_repo(.:format)                                                                 projects#link_repo
#                 set_journal_branch_project PATCH  /projects/:id/set_journal_branch(.:format)                                                        projects#set_journal_branch
#                           add_kudo_project POST   /projects/:id/add_kudo(.:format)                                                                  projects#add_kudo
#                       destroy_kudo_project DELETE /projects/:id/kudos/:kudo_id(.:format)                                                            projects#destroy_kudo
#                            project_devlogs POST   /projects/:project_id/devlogs(.:format)                                                           devlogs#create
#                             project_devlog GET    /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#show
#                                            PATCH  /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#update
#                                            PUT    /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#update
#                                            DELETE /projects/:project_id/devlogs/:id(.:format)                                                       devlogs#destroy
#                       project_devlog_image POST   /projects/:project_id/devlog_image(.:format)                                                      devlogs#upload_image
#              project_collaboration_invites POST   /projects/:project_id/invites(.:format)                                                           collaboration_invites#create
#               project_collaboration_invite DELETE /projects/:project_id/invites/:id(.:format)                                                       collaboration_invites#destroy
#                       project_collaborator DELETE /projects/:project_id/collaborators/:id(.:format)                                                 project_collaborators#destroy
#                               project_view POST   /projects/:project_id/view(.:format)                                                              projects/views#create
#                              project_reels GET    /projects/:project_id/reels(.:format)                                                             reels#manage
#                                            POST   /projects/:project_id/reels(.:format)                                                             reels#create
#                           new_project_reel GET    /projects/:project_id/reels/new(.:format)                                                         reels#new
#                                   projects POST   /projects(.:format)                                                                               projects#create
#                                new_project GET    /projects/new(.:format)                                                                           projects#new
#                               edit_project GET    /projects/:id/edit(.:format)                                                                      projects#edit
#                                    project GET    /projects/:id(.:format)                                                                           projects#show
#                                            PATCH  /projects/:id(.:format)                                                                           projects#update
#                                            PUT    /projects/:id(.:format)                                                                           projects#update
#                                            DELETE /projects/:id(.:format)                                                                           projects#destroy
#                accept_collaboration_invite POST   /collaboration_invites/:id/accept(.:format)                                                       collaboration_invites#accept
#               decline_collaboration_invite POST   /collaboration_invites/:id/decline(.:format)                                                      collaboration_invites#decline
#                                       docs GET    /docs(.:format)                                                                                   markdown#show
#                                        doc GET    /docs/*slug(.:format)                                                                             markdown#show
#                                 guide_file GET    /guides/:slug/files/*path                                                                         guides_files#show
#                            api_v1_projects GET    /api/v1/projects(.:format)                                                                        api/v1/projects#index
#                             api_v1_project GET    /api/v1/projects/:id(.:format)                                                                    api/v1/projects#show
#                                api_v1_user GET    /api/v1/users/:id(.:format)                                                                       api/v1/users#show
#                                                   /*path(.:format)                                                                                  errors#not_found
#           turbo_recede_historical_location GET    /recede_historical_location(.:format)                                                             turbo/native/navigation#recede
#           turbo_resume_historical_location GET    /resume_historical_location(.:format)                                                             turbo/native/navigation#resume
#          turbo_refresh_historical_location GET    /refresh_historical_location(.:format)                                                            turbo/native/navigation#refresh
#              rails_postmark_inbound_emails POST   /rails/action_mailbox/postmark/inbound_emails(.:format)                                           action_mailbox/ingresses/postmark/inbound_emails#create
#                 rails_relay_inbound_emails POST   /rails/action_mailbox/relay/inbound_emails(.:format)                                              action_mailbox/ingresses/relay/inbound_emails#create
#              rails_sendgrid_inbound_emails POST   /rails/action_mailbox/sendgrid/inbound_emails(.:format)                                           action_mailbox/ingresses/sendgrid/inbound_emails#create
#        rails_mandrill_inbound_health_check GET    /rails/action_mailbox/mandrill/inbound_emails(.:format)                                           action_mailbox/ingresses/mandrill/inbound_emails#health_check
#              rails_mandrill_inbound_emails POST   /rails/action_mailbox/mandrill/inbound_emails(.:format)                                           action_mailbox/ingresses/mandrill/inbound_emails#create
#               rails_mailgun_inbound_emails POST   /rails/action_mailbox/mailgun/inbound_emails/mime(.:format)                                       action_mailbox/ingresses/mailgun/inbound_emails#create
#             rails_conductor_inbound_emails GET    /rails/conductor/action_mailbox/inbound_emails(.:format)                                          rails/conductor/action_mailbox/inbound_emails#index
#                                            POST   /rails/conductor/action_mailbox/inbound_emails(.:format)                                          rails/conductor/action_mailbox/inbound_emails#create
#          new_rails_conductor_inbound_email GET    /rails/conductor/action_mailbox/inbound_emails/new(.:format)                                      rails/conductor/action_mailbox/inbound_emails#new
#              rails_conductor_inbound_email GET    /rails/conductor/action_mailbox/inbound_emails/:id(.:format)                                      rails/conductor/action_mailbox/inbound_emails#show
#   new_rails_conductor_inbound_email_source GET    /rails/conductor/action_mailbox/inbound_emails/sources/new(.:format)                              rails/conductor/action_mailbox/inbound_emails/sources#new
#      rails_conductor_inbound_email_sources POST   /rails/conductor/action_mailbox/inbound_emails/sources(.:format)                                  rails/conductor/action_mailbox/inbound_emails/sources#create
#      rails_conductor_inbound_email_reroute POST   /rails/conductor/action_mailbox/:inbound_email_id/reroute(.:format)                               rails/conductor/action_mailbox/reroutes#create
#   rails_conductor_inbound_email_incinerate POST   /rails/conductor/action_mailbox/:inbound_email_id/incinerate(.:format)                            rails/conductor/action_mailbox/incinerates#create
#                         rails_service_blob GET    /rails/active_storage/blobs/redirect/:signed_id/*filename(.:format)                               active_storage/blobs/redirect#show
#                   rails_service_blob_proxy GET    /rails/active_storage/blobs/proxy/:signed_id/*filename(.:format)                                  active_storage/blobs/proxy#show
#                                            GET    /rails/active_storage/blobs/:signed_id/*filename(.:format)                                        active_storage/blobs/redirect#show
#                  rails_blob_representation GET    /rails/active_storage/representations/redirect/:signed_blob_id/:variation_key/*filename(.:format) active_storage/representations/redirect#show
#            rails_blob_representation_proxy GET    /rails/active_storage/representations/proxy/:signed_blob_id/:variation_key/*filename(.:format)    active_storage/representations/proxy#show
#                                            GET    /rails/active_storage/representations/:signed_blob_id/:variation_key/*filename(.:format)          active_storage/representations/redirect#show
#                         rails_disk_service GET    /rails/active_storage/disk/:encoded_key/*filename(.:format)                                       active_storage/disk#show
#                  update_rails_disk_service PUT    /rails/active_storage/disk/:encoded_token(.:format)                                               active_storage/disk#update
#                       rails_direct_uploads POST   /rails/active_storage/direct_uploads(.:format)                                                    active_storage/direct_uploads#create
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
      get "reviews" => "reviews#index", as: :reviews
      get "reviews/:tier" => "reviews#index", as: :tier_reviews, constraints: { tier: /t[1-4]/ }
      get "reviews/leaderboard" => "reviews#leaderboard", as: :reviews_leaderboard
      get "reviews/requirements" => "reviews#requirements", as: :requirements_reviews
      get "reviews/flagged" => "reviews#flagged", as: :flagged_reviews
      get "reviews/:id" => "reviews#show", as: :review
      post "reviews/:id/skip" => "reviews#skip", as: :skip_review
      post "reviews/:id/track" => "reviews#track", as: :track_review
      post "reviews/:id/claim" => "reviews#claim", as: :claim_review
      resources :review_sessions, only: [] do
        member do
          patch :heartbeat
          post :release
        end
      end

      resources :projects, only: [ :index, :show, :destroy ] do
        member do
          post :review
          post :restore
          post :toggle_hidden
          post :toggle_shadow_ban
          post :toggle_staff_pick
          post :change_tier
          post :convert_review_type
          post :add_note
          post :mark_unbuilt
          post :reverse_review
          post :ai_requirements_check
          get :ai_requirements_check_status
          get :repo_tree
          get :commit_stats
          get :changes_since_review
          post :send_checkpoint_message
          post :send_dm_message
          delete "notes/:note_id" => "projects#destroy_note", as: :destroy_note
          patch "notes/:note_id" => "projects#update_note", as: :update_note
          post :flag_for_review
          post :unflag_for_review
        end
      end
      resources :users, only: [ :index, :show, :destroy ] do
        member do
          patch :update_roles
          patch :update_permissions
          patch :update_guild
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
          post :adjust_streak
          get :coin_history
          post :toggle_shop_unlocked
          post :toggle_maintenance_bypass
          post :toggle_bypass_idv
          post :sync_idv
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
        collection do
          post :payout_all
        end
        member do
          post :approve
          post :reject
        end
      end
      resources :reel_ads, only: [ :index, :create, :update, :destroy ] do
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
          post :revert_project
          post :send_back
          post :check_justification
        end
      end
      resources :hackatime_bans, only: [ :index ] do
        collection do
          post :refresh
          post :ban_all
        end
      end
      get "metrics" => "metrics#index", as: :metrics
      get "airtable_sync" => "airtable_sync#index", as: :airtable_sync
      post "airtable_sync/recheck" => "airtable_sync#recheck", as: :airtable_sync_recheck
      post "airtable_sync/requeue/:project_id" => "airtable_sync#requeue", as: :airtable_sync_requeue
      get "slack_pings" => "slack_pings#index", as: :slack_pings
      post "slack_pings/weekly_ping" => "slack_pings#weekly_ping", as: :slack_pings_weekly_ping
      post "slack_pings/leaderboard" => "slack_pings#leaderboard", as: :slack_pings_leaderboard
      post "slack_pings/streak_breaks" => "slack_pings#streak_breaks", as: :slack_pings_streak_breaks
      post "slack_pings/invites" => "slack_pings#invites", as: :slack_pings_invites
      resources :review_audits, only: [ :index, :show ]
      get "audit_log" => "audit_log#index", as: :audit_log
      get "audit_log/:id" => "audit_log#show", as: :audit_log_entry
      get "database" => "database#index", as: :database
      post "database/query" => "database#query"
      get "api_keys" => "api_keys#index", as: :api_keys
      post "api_keys/:id" => "api_keys#update", as: :api_key
      post "api_keys/:id/test" => "api_keys#test", as: :api_key_test
      delete "api_keys/:id" => "api_keys#destroy"
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

  post "impersonate/:user_id" => "impersonations#create", as: :impersonate
  delete "impersonate" => "impersonations#destroy", as: :stop_impersonating

  get "sorry" => "bans#show", as: :sorry

  get "home" => "home#index", as: :home
  get "settings" => "settings#show", as: :settings
  get "settings/avatar_proxy" => "settings#avatar_proxy", as: :settings_avatar_proxy
  patch "settings/timezone" => "settings#update_timezone", as: :settings_timezone
  post "onboarding/complete" => "onboarding#complete", as: :complete_onboarding
  post "onboarding/restart" => "onboarding#restart", as: :restart_onboarding
  post "forge_keeper/chat" => "forge_keeper#chat", as: :forge_keeper_chat
  post "profile/sync_address" => "profile#sync_address", as: :sync_address
  get "rsvp" => "rsvps#index", as: :rsvp
  post "rsvp" => "rsvps#create"
  get "rsvp/referral" => "rsvps#referral", as: :rsvp_referral

  get "explore" => "explore#index", as: :explore
  get "leaderboard" => "leaderboard#index", as: :leaderboard
  get "relight" => "relight#index", as: :relight
  get "referrals" => "referrals#index", as: :referrals
  get "shop" => "shop#index", as: :shop
  post "shop/orders" => "shop#create", as: :shop_orders
  patch "shop/region" => "shop#update_region", as: :shop_region
  get "users/:id" => "users#show", as: :user
  post "users/:id/kudos" => "users#add_kudo", as: :user_kudos
  delete "users/:id/kudos/:kudo_id" => "users#destroy_kudo", as: :user_kudo
  patch "users/:id/github" => "users#update_github", as: :user_github

  get  "guilds/choose" => "guild_choices#new", as: :new_guild_choice
  post "guilds/choose" => "guild_choices#create", as: :guild_choices
  resources :guilds, only: %i[index show] do
    collection do
      get :leaderboard
    end
  end

  get "reels" => "reels#index", as: :reels_feed
  post "reel_ads/:id/impression" => "reel_ads#impression", as: :reel_ad_impression
  post "reel_ads/:id/click" => "reel_ads#click", as: :reel_ad_click
  resources :reels, only: [ :show, :edit, :update, :destroy ] do
    resource :kudo, only: [ :create, :destroy ], module: :reels, controller: "kudos"
    resource :view, only: [ :create ], module: :reels, controller: "views"
    resources :comments, only: [ :index, :create, :destroy ], module: :reels
  end

  resources :projects, except: :index do
    collection do
      post :import_from_github
      post :import_from_macondo
      get :hackatime_projects
    end
    member do
      post :submit_for_review
      get :ai_check
      post :run_ai_check
      get :ai_check_status
      post :sync_journal
      get :export_devlogs
      post :resubmit_pitch
      post :upload_cover_image
      patch :set_devlog_mode
      patch :link_repo
      patch :set_journal_branch
      post :add_kudo
      delete "kudos/:kudo_id" => "projects#destroy_kudo", as: :destroy_kudo
    end
    resources :devlogs, only: [ :show, :create, :update, :destroy ]
    post "devlog_image" => "devlogs#upload_image", as: :devlog_image
    resources :collaboration_invites, only: [ :create, :destroy ], path: "invites"
    resources :collaborators, only: [ :destroy ], controller: "project_collaborators"
    resource :view, only: [ :create ], module: :projects, controller: "views"
    resources :reels, only: [ :new, :create ] do
      collection do
        get "", action: :manage, as: ""
      end
    end
  end

  resources :collaboration_invites, only: [] do
    member do
      post :accept
      post :decline
    end
  end

  get "docs" => "markdown#show", as: :docs
  get "docs/*slug" => "markdown#show", as: :doc
  get "guides/:slug/files/*path" => "guides_files#show", as: :guide_file, format: false

  namespace :api do
    namespace :v1 do
      resources :projects, only: [ :index, :show ]
      resources :users, only: [ :show ]
    end
  end

  match "*path", to: "errors#not_found", via: :all, constraints: ->(req) { !req.path.start_with?("/rails/") }
end
