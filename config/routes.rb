Shareabouts::Application.routes.draw do
  mount RailsAdmin::Engine => '/admin', :as => 'rails_admin'

  devise_for :users

  resources :points, :only => [:new, :create, :index, :show]

  root :to => 'points#index'
end
