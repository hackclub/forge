# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_05_01_000309) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "ahoy_events", force: :cascade do |t|
    t.string "name"
    t.jsonb "properties"
    t.datetime "time"
    t.bigint "user_id"
    t.bigint "visit_id"
    t.index ["name", "time"], name: "index_ahoy_events_on_name_and_time"
    t.index ["properties"], name: "index_ahoy_events_on_properties", opclass: :jsonb_path_ops, using: :gin
    t.index ["user_id"], name: "index_ahoy_events_on_user_id"
    t.index ["visit_id"], name: "index_ahoy_events_on_visit_id"
  end

  create_table "ahoy_visits", force: :cascade do |t|
    t.string "app_version"
    t.string "browser"
    t.string "city"
    t.string "country"
    t.string "device_type"
    t.string "ip"
    t.text "landing_page"
    t.float "latitude"
    t.float "longitude"
    t.string "os"
    t.string "os_version"
    t.string "platform"
    t.text "referrer"
    t.string "referring_domain"
    t.string "region"
    t.datetime "started_at"
    t.text "user_agent"
    t.bigint "user_id"
    t.string "utm_campaign"
    t.string "utm_content"
    t.string "utm_medium"
    t.string "utm_source"
    t.string "utm_term"
    t.string "visit_token"
    t.string "visitor_token"
    t.index ["user_id"], name: "index_ahoy_visits_on_user_id"
    t.index ["visit_token"], name: "index_ahoy_visits_on_visit_token", unique: true
    t.index ["visitor_token", "started_at"], name: "index_ahoy_visits_on_visitor_token_and_started_at"
  end

  create_table "airtable_queue_items", force: :cascade do |t|
    t.string "airtable_record_id"
    t.datetime "created_at", null: false
    t.bigint "enqueued_by_id"
    t.text "error"
    t.string "forge_id", null: false
    t.jsonb "payload", default: {}, null: false
    t.bigint "project_id"
    t.datetime "sent_at"
    t.bigint "sent_by_id"
    t.integer "status", default: 0, null: false
    t.string "table_name", null: false
    t.datetime "updated_at", null: false
    t.index ["enqueued_by_id"], name: "index_airtable_queue_items_on_enqueued_by_id"
    t.index ["project_id"], name: "index_airtable_queue_items_on_project_id"
    t.index ["sent_by_id"], name: "index_airtable_queue_items_on_sent_by_id"
    t.index ["status"], name: "index_airtable_queue_items_on_status"
  end

  create_table "audit_events", force: :cascade do |t|
    t.string "action", null: false
    t.bigint "actor_id"
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "metadata", default: {}, null: false
    t.bigint "target_id"
    t.string "target_label"
    t.string "target_type"
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_audit_events_on_action"
    t.index ["actor_id"], name: "index_audit_events_on_actor_id"
    t.index ["created_at"], name: "index_audit_events_on_created_at"
    t.index ["target_type", "target_id"], name: "index_audit_events_on_target_type_and_target_id"
  end

  create_table "badges", force: :cascade do |t|
    t.datetime "awarded_at", null: false
    t.bigint "awarder_id"
    t.string "color", default: "orange", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "icon", default: "military_tech", null: false
    t.string "key"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["awarder_id"], name: "index_badges_on_awarder_id"
    t.index ["user_id", "key"], name: "index_badges_on_user_id_and_key", unique: true, where: "(key IS NOT NULL)"
    t.index ["user_id"], name: "index_badges_on_user_id"
  end

  create_table "coin_adjustments", force: :cascade do |t|
    t.bigint "actor_id"
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.text "reason", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["actor_id"], name: "index_coin_adjustments_on_actor_id"
    t.index ["user_id"], name: "index_coin_adjustments_on_user_id"
  end

  create_table "devlogs", force: :cascade do |t|
    t.decimal "approved_hours"
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "project_id", null: false
    t.text "review_feedback"
    t.datetime "reviewed_at"
    t.bigint "reviewer_id"
    t.integer "status", default: 0, null: false
    t.string "time_spent"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_devlogs_on_project_id"
    t.index ["status"], name: "index_devlogs_on_status"
  end

  create_table "feature_flags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description"
    t.boolean "enabled", default: false, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_feature_flags_on_name", unique: true
  end

  create_table "kudos", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "project_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["author_id"], name: "index_kudos_on_author_id"
    t.index ["project_id"], name: "index_kudos_on_project_id"
    t.index ["user_id"], name: "index_kudos_on_user_id"
  end

  create_table "news_posts", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.boolean "published", default: false, null: false
    t.datetime "published_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_news_posts_on_author_id"
    t.index ["published", "published_at"], name: "index_news_posts_on_published_and_published_at"
  end

  create_table "orders", force: :cascade do |t|
    t.decimal "amount_usd", precision: 10, scale: 2
    t.bigint "assigned_to_id"
    t.decimal "coin_cost", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "fulfilled_at"
    t.string "hcb_grant_link"
    t.string "kind", null: false
    t.bigint "project_id"
    t.integer "quantity", default: 1, null: false
    t.string "region"
    t.text "review_notes"
    t.datetime "reviewed_at"
    t.bigint "reviewer_id"
    t.bigint "shop_item_id"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["assigned_to_id"], name: "index_orders_on_assigned_to_id"
    t.index ["kind"], name: "index_orders_on_kind"
    t.index ["project_id"], name: "index_orders_on_project_id"
    t.index ["region"], name: "index_orders_on_region"
    t.index ["reviewer_id"], name: "index_orders_on_reviewer_id"
    t.index ["shop_item_id"], name: "index_orders_on_shop_item_id"
    t.index ["status"], name: "index_orders_on_status"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "project_notes", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_project_notes_on_author_id"
    t.index ["project_id"], name: "index_project_notes_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.text "budget"
    t.string "build_proof_url"
    t.datetime "built_at"
    t.string "cover_image_url"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "devlog_mode"
    t.datetime "discarded_at"
    t.string "green_flags", default: [], array: true
    t.boolean "hidden", default: false, null: false
    t.string "name", null: false
    t.decimal "override_hours"
    t.text "override_hours_justification"
    t.text "pitch_text"
    t.text "readme_cache"
    t.datetime "readme_fetched_at"
    t.string "red_flags", default: [], array: true
    t.string "repo_link"
    t.text "review_feedback"
    t.datetime "reviewed_at"
    t.bigint "reviewer_id"
    t.string "slack_channel_id"
    t.string "slack_message_ts"
    t.datetime "staff_pick_at"
    t.integer "status", default: 0, null: false
    t.string "subtitle"
    t.string "tags", default: [], null: false, array: true
    t.string "tier", default: "tier_4", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["discarded_at"], name: "index_projects_on_discarded_at"
    t.index ["staff_pick_at"], name: "index_projects_on_staff_pick_at"
    t.index ["status"], name: "index_projects_on_status"
    t.index ["tags"], name: "index_projects_on_tags", using: :gin
    t.index ["user_id"], name: "index_projects_on_user_id"
  end

  create_table "referral_prize_pools", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.decimal "total_paid_out", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
  end

  create_table "referrals", force: :cascade do |t|
    t.datetime "approved_at"
    t.bigint "approver_id"
    t.datetime "created_at", null: false
    t.datetime "eligible_at"
    t.bigint "payout_adjustment_id"
    t.bigint "qualifying_project_id"
    t.bigint "referred_id", null: false
    t.bigint "referrer_id", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["approver_id"], name: "index_referrals_on_approver_id"
    t.index ["payout_adjustment_id"], name: "index_referrals_on_payout_adjustment_id"
    t.index ["qualifying_project_id"], name: "index_referrals_on_qualifying_project_id"
    t.index ["referred_id"], name: "index_referrals_on_referred_id", unique: true
    t.index ["referrer_id"], name: "index_referrals_on_referrer_id"
    t.index ["status"], name: "index_referrals_on_status"
  end

  create_table "rsvps", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_rsvps_on_email", unique: true
  end

  create_table "ships", force: :cascade do |t|
    t.integer "approved_seconds"
    t.datetime "created_at", null: false
    t.text "feedback"
    t.string "frozen_demo_link"
    t.text "frozen_hca_data"
    t.string "frozen_repo_link"
    t.string "frozen_screenshot"
    t.string "justification"
    t.bigint "project_id", null: false
    t.bigint "reviewer_id"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_ships_on_project_id"
    t.index ["reviewer_id"], name: "index_ships_on_reviewer_id"
    t.index ["status"], name: "index_ships_on_status"
  end

  create_table "shop_item_regions", force: :cascade do |t|
    t.decimal "coin_cost", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.boolean "enabled", default: true, null: false
    t.string "region", null: false
    t.bigint "shop_item_id", null: false
    t.datetime "updated_at", null: false
    t.index ["region"], name: "index_shop_item_regions_on_region"
    t.index ["shop_item_id", "region"], name: "index_shop_item_regions_on_shop_item_id_and_region", unique: true
    t.index ["shop_item_id"], name: "index_shop_item_regions_on_shop_item_id"
  end

  create_table "shop_items", force: :cascade do |t|
    t.decimal "coin_cost", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "enabled", default: true, null: false
    t.string "image_url"
    t.string "internal_order_link"
    t.decimal "internal_price_usd", precision: 10, scale: 2
    t.integer "max_quantity"
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "support_tickets", force: :cascade do |t|
    t.string "bts_channel_id", null: false
    t.string "bts_message_ts"
    t.string "channel_id", null: false
    t.datetime "claimed_at"
    t.string "claimed_by_name"
    t.string "claimed_by_slack_id"
    t.datetime "created_at", null: false
    t.text "original_text", null: false
    t.datetime "resolved_at"
    t.string "resolved_by_name"
    t.string "resolved_by_slack_id"
    t.string "slack_avatar_url"
    t.string "slack_display_name"
    t.string "slack_user_id", null: false
    t.integer "status", default: 0, null: false
    t.string "thread_ts", null: false
    t.datetime "updated_at", null: false
    t.index ["bts_message_ts"], name: "index_support_tickets_on_bts_message_ts"
    t.index ["status"], name: "index_support_tickets_on_status"
    t.index ["thread_ts"], name: "index_support_tickets_on_thread_ts", unique: true
  end

  create_table "user_activity_days", force: :cascade do |t|
    t.date "active_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "active_on"], name: "index_user_activity_days_on_user_id_and_active_on", unique: true
    t.index ["user_id"], name: "index_user_activity_days_on_user_id"
  end

  create_table "user_notes", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["author_id"], name: "index_user_notes_on_author_id"
    t.index ["user_id"], name: "index_user_notes_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "address_line1"
    t.string "address_line2"
    t.string "avatar", null: false
    t.text "ban_reason"
    t.date "birthday"
    t.string "city"
    t.string "country"
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.string "display_name", null: false
    t.string "email", null: false
    t.string "first_name"
    t.string "fulfillment_regions", default: [], null: false, array: true
    t.string "git_instance_url"
    t.string "git_provider", default: "github"
    t.string "github_username"
    t.string "hca_id", null: false
    t.text "hca_token"
    t.boolean "is_adult", default: false, null: false
    t.boolean "is_banned", default: false, null: false
    t.boolean "is_beta_approved", default: false, null: false
    t.string "last_name"
    t.datetime "last_seen_at"
    t.boolean "maintenance_bypass", default: false, null: false
    t.datetime "onboarded_at"
    t.string "permissions", default: [], null: false, array: true
    t.string "phone_number"
    t.string "postal_code"
    t.string "referral_code"
    t.string "region", default: "rest_of_world"
    t.string "roles", default: [], null: false, array: true
    t.boolean "shop_unlocked", default: false, null: false
    t.string "slack_id", null: false
    t.string "state"
    t.string "timezone", null: false
    t.datetime "updated_at", null: false
    t.string "verification_status"
    t.index ["discarded_at"], name: "index_users_on_discarded_at"
    t.index ["last_seen_at"], name: "index_users_on_last_seen_at"
    t.index ["referral_code"], name: "index_users_on_referral_code", unique: true
  end

  create_table "versions", force: :cascade do |t|
    t.datetime "created_at"
    t.string "event", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.text "object"
    t.string "whodunnit"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "airtable_queue_items", "projects"
  add_foreign_key "airtable_queue_items", "users", column: "enqueued_by_id"
  add_foreign_key "airtable_queue_items", "users", column: "sent_by_id"
  add_foreign_key "audit_events", "users", column: "actor_id"
  add_foreign_key "badges", "users"
  add_foreign_key "badges", "users", column: "awarder_id"
  add_foreign_key "coin_adjustments", "users"
  add_foreign_key "coin_adjustments", "users", column: "actor_id"
  add_foreign_key "devlogs", "projects"
  add_foreign_key "devlogs", "users", column: "reviewer_id"
  add_foreign_key "kudos", "projects"
  add_foreign_key "kudos", "users"
  add_foreign_key "kudos", "users", column: "author_id"
  add_foreign_key "news_posts", "users", column: "author_id"
  add_foreign_key "orders", "projects"
  add_foreign_key "orders", "shop_items"
  add_foreign_key "orders", "users"
  add_foreign_key "orders", "users", column: "assigned_to_id"
  add_foreign_key "orders", "users", column: "reviewer_id"
  add_foreign_key "project_notes", "projects"
  add_foreign_key "project_notes", "users", column: "author_id"
  add_foreign_key "projects", "users"
  add_foreign_key "projects", "users", column: "reviewer_id"
  add_foreign_key "referrals", "coin_adjustments", column: "payout_adjustment_id"
  add_foreign_key "referrals", "projects", column: "qualifying_project_id"
  add_foreign_key "referrals", "users", column: "approver_id"
  add_foreign_key "referrals", "users", column: "referred_id"
  add_foreign_key "referrals", "users", column: "referrer_id"
  add_foreign_key "ships", "projects"
  add_foreign_key "ships", "users", column: "reviewer_id"
  add_foreign_key "shop_item_regions", "shop_items"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "user_activity_days", "users"
  add_foreign_key "user_notes", "users"
  add_foreign_key "user_notes", "users", column: "author_id"
end
