Shareabouts::Application.routes.draw do
  mount RailsAdmin::Engine => '/admin', :as => 'rails_admin'

  devise_for :users

  resources :feature_points, :only => [:new, :create, :index, :show] do
    resources :votes, :only => [:create]
    resources :comments, :only => [:create]
  end
  
  resources :regions, :only => [:index] do
    collection do
      get 'import', :as => :import
      post 'upload', :as => :upload, :path => 'import'
    end
  end
  
  match "regions/import", :to => "regions#import", :via => :get, :as => :import_regions
  match "regions/import", :to => "regions#upload", :via => :post, :as => :upload_regions

  root :to => 'feature_points#index'
end
