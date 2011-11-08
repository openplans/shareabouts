Calico::Application.routes.draw do
  mount RailsAdmin::Engine => '/admin', :as => 'rails_admin'

  devise_for :users

  resources :points, :only => [:new, :create, :index]

  root :to => 'points#index'
end
