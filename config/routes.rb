Shareabouts::Application.routes.draw do
  mount RailsAdmin::Engine => '/admin', :as => 'rails_admin'

  devise_for :users, :controllers => { :omniauth_callbacks => "users/omniauth_callbacks" } do
    get 'sign_in', :to => 'users/sessions#new', :as => :new_user_session
    get 'sign_out', :to => 'users/sessions#destroy', :as => :destroy_user_session
  end
  
  devise_for :admins, :path => "authmin" # silly path due to conflict with rails_admin path

  resources :feature_points, :path => 'locations', :only => [:new, :create, :index, :show, :update] do
    resources :votes, :only => [:create, :destroy]
    resources :comments, :only => [:create]
    collection do
      get 'within_region'
    end
  end
  
  resources :feature_polygons, :path => 'areas', :only => [:index]
  
  resources :regions, :only => [:index] do
    collection do
      get 'import', :as => :import
      post 'upload', :as => :upload, :path => 'import'
    end
  end
  
  resources :pages, :only => [:show]
  resources :activity, :only => [:index]
  
  match "regions/import", :to => "regions#import", :via => :get, :as => :import_regions
  match "regions/import", :to => "regions#upload", :via => :post, :as => :upload_regions
  
  root :to => 'feature_points#index'
end
