Shareabouts::Application.routes.draw do
  mount RailsAdmin::Engine => '/admin', :as => 'rails_admin'

  devise_for :users

  resources :points, :only => [:new, :create, :index, :show] do
    resources :votes, :only => [:new, :create]
  end

  root :to => 'points#index'
end
