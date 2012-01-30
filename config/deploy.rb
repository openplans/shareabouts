# RVM bootstrap
$:.unshift(File.expand_path('./lib', ENV['rvm_path']))
require 'rvm/capistrano'
set :rvm_ruby_string, '1.9.2-p290'

# bundler bootstrap
require 'bundler/capistrano'

# multistage deployment
set :stages, %w(staging production)
set :default_stage, "production"
require 'capistrano/ext/multistage'

require 'delayed/recipes'

# main details
set :application, "shareabouts"

set(:domain) { "#{domain}" }
role(:web) { domain }
role(:app) { domain }
role(:db, :primary => true) { domain }

# server details
default_run_options[:pty] = true
ssh_options[:forward_agent] = true
set :use_sudo, false

# repo details
set :scm, :git
set :repository, "git@github.com:openplans/shareabouts.git"
set :git_enable_submodules, 1
set :deploy_via, :remote_cache

# tasks
namespace :deploy do
  task :start, :roles => :app do
    run "touch #{current_path}/tmp/restart.txt"
  end

  task :stop, :roles => :app do
    # Do nothing.
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "touch #{current_path}/tmp/restart.txt"
  end
end

namespace :delayed_job do 
  desc "Restart the delayed_job process"
  task :restart, :roles => :app do
    run "cd #{current_path}; RAILS_ENV=production script/delayed_job restart"
  end
end

namespace :db do
  task :symlink, :except => { :no_release => true } do
    run "ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml"
  end
end

namespace :facebook do
  task :symlink, :except => { :no_release => true } do
    run "ln -nfs #{shared_path}/config/facebook.yml #{release_path}/config/facebook.yml"
  end
end

namespace :assets do
  task :precompile do
    run "cd #{release_path}; RAILS_ENV=production bundle exec rake assets:precompile"
  end
end

after "deploy:finalize_update", "db:symlink"
after 'deploy:update_code', "facebook:symlink"
after 'deploy:update_code', "assets:precompile"
# after "deploy:update_code", "delayed_job:restart"
