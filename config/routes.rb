Shareabouts::Application.routes.draw do
  mount RailsAdmin::Engine => '/admin', :as => 'rails_admin'

  devise_for :users

  resources :feature_points, :only => [:new, :create, :index, :show] do
    resources :votes, :only => [:create]
    resources :comments, :only => [:create]
  end

  root :to => 'feature_points#index'
end
