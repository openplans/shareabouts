#         ooooooooo.              o8o  oooo                 .o.             .o8                     o8o
#         `888   `Y88.            `"'  `888                .888.           "888                     `"'
#          888   .d88'  .oooo.   oooo   888   .oooo.o     .8"888.      .oooo888  ooo. .oo.  .oo.   oooo  ooo. .oo.
#          888ooo88P'  `P  )88b  `888   888  d88(  "8    .8' `888.    d88' `888  `888P"Y88bP"Y88b  `888  `888P"Y88b
#          888`88b.     .oP"888   888   888  `"Y88b.    .88ooo8888.   888   888   888   888   888   888   888   888
#          888  `88b.  d8(  888   888   888  o.  )88b  .8'     `888.  888   888   888   888   888   888   888   888
#         o888o  o888o `Y888""8o o888o o888o 8""888P' o88o     o8888o `Y8bod88P" o888o o888o o888o o888o o888o o888o

# RailsAdmin config file. Generated on November 03, 2011 10:20
# See github.com/sferik/rails_admin for more informations

RailsAdmin.config do |config|

  config.current_user_method { current_admin } # auto-generated
  
  # Set the admin name here (optional second array element will appear in a beautiful RailsAdmin red ©)
  config.main_app_name = ['Shareabouts', 'Admin']
  # or for a dynamic name:
  # config.main_app_name = Proc.new { |controller| [Rails.application.engine_name.titleize, controller.params['action'].titleize] }

  #  ==> Authentication (before_filter)
  # This is run inside the controller instance so you can setup any authentication you need to.
  # By default, the authentication will run via warden if available.
  # and will run on the default user scope.
  # If you use devise, this will authenticate the same as authenticate_user!
  # Example Devise admin
  RailsAdmin.config do |config|
    config.authenticate_with do
      authenticate_admin!
    end
  end

  #  ==> Authorization
  # Use cancan https://github.com/ryanb/cancan for authorization:
  config.authorize_with :cancan

  # Or use simple custom authorization rule:
  # config.authorize_with do
  #   redirect_to root_path unless warden.user.is_admin?
  # end

  # Use a specific role for ActiveModel's :attr_acessible :attr_protected
  # Default is :default
  # current_user is accessible in the block if you want to make it user specific.
  # config.attr_accessible_role { :default }

  #  ==> Global show view settings
  # Display empty fields in show views
  # config.compact_show_view = false

  #  ==> Global list view settings
  # Number of default rows per-page:
  # config.default_items_per_page = 50

  #  ==> Included models
  # Add all excluded models here:
  # config.excluded_models << []

  # Add models here if you want to go 'whitelist mode':
  config.included_models += %w{SiteOption Admin FeaturePoint FeaturePolygon Comment LocationType Page Shapefile Profile Region Vote}

  # Application wide tried label methods for models' instances
  # config.label_methods << [:description] # Default is [:name, :title]

  #  ==> Global models configuration
  # config.models do
  #   # Configuration here will affect all included models in all scopes, handle with care!
  #
  #   list do
  #     # Configuration here will affect all included models in list sections (same for show, export, edit, update, create)
  #
  #     fields :name, :other_name do
  #       # Configuration here will affect all fields named [:name, :other_name], in the list section, for all included models
  #     end
  #
  #     fields_of_type :date do
  #       # Configuration here will affect all date fields, in the list section, for all included models. See README for a comprehensive type list.
  #     end
  #   end
  # end
  #
  #  ==> Model specific configuration
  # Try to override as few things as possible, in the most generic way. Try to avoid setting labels for models and attributes, use ActiveRecord I18n API instead.
  
  config.model FeaturePoint do
    object_label_method :display_name     # Name of the method called for pretty printing an *instance* of ModelName
    weight -1                     # Navigation priority. Bigger is higher.
    label "Point"
    label_plural "Points"
    
    navigation_label "Map features"

    list do
      items_per_page 100
      field :visible
      field :name
      field :location_type do
        searchable
      end
      field :profile do
        label 'Contributer'
        searchable [:id, :name]
      end
      field :display_submitter do
        label 'Contributer name'
        searchable :submitter_name
      end
      field :support_count
      field :regions
      field :display_the_geom do
        label 'Location'
      end
      field :created_at
    end
    
    show do
      field :visible
      field :name do
        label 'Title'
      end
      field :description
      field :location_type
      field :profile do
        label 'Contributer'
      end
      field :display_submitter do
        label 'Contributer name'
        searchable
      end
      field :regions
      field :comments
      field :support_count
      field :display_the_geom do
        label 'Location'
      end
      field :created_at
    end
    
    export do
      field :id
      field :latitude
      field :longitude
      field :name do
        label 'Title'
      end
      field :description
      field :support_count
      field :profile_id do
        label 'Contributer id'
      end
      field :display_submitter do
        label 'Sumbitter name'
      end
      field :location_type
      field :regions
      field :created_at
    end
  end
  
  config.model FeaturePolygon do
    parent FeaturePoint
    label "Polygon"
    label_plural "Polygons"
    
    list do
      fields :id, :name, :shapefile, :workflow_state, :visible
    end
    
    edit do
      fields :shapefile, :name, :description, :visible
    end
  end
  
  config.model Profile do
    navigation_label "Community"
    label "Contributer"
    label_plural "Contributers"
  end
  
  config.model Comment do
    object_label_method :comment
    parent Profile
    
    list do
      field :comment
      field :commentable
      field :display_submitter
      field :profile_id do
        label 'Contributer id'
      end
      field :created_at
    end
    
    edit do
      field :comment
      field :submitter_name
    end
    
    show do
      field :id
      field :comment
      field :submitter_name
      field :profile_id do
        label 'Contributer id'
      end
      field :commentable
      fields :created_at, :updated_at
    end    
  end

  config.model Vote do
    parent Profile
  end
  
  config.model Shapefile do
    navigation_label "Feature Metadata"
    
    object_label_method :kind 
    list do
      field :id
      field :kind
      field :data
      field :workflow_state
      field :default
    end
    
    edit do
      field :data
      field :kind
      field :name_field
      field :default
    end
  end
  
  config.model Region do
    parent Shapefile
  end
  
  config.model LocationType do
    parent Shapefile
    edit do
      fields :name, :image
      field :marker
    end
    
    show do 
      fields :name, :image
      field :marker
    end
  end
  
  config.model Marker do    
    edit do
      fields :icon_width, :icon_height, :icon_anchor_x, :icon_anchor_y, :popup_anchor_x, :popup_anchor_y
    end
  end
  
  config.model Admin do
    navigation_label "Site Admin"
    weight 500
    object_label_method :email 
  end
  
  config.model SiteOption do
    parent Admin
    object_label_method :option_name 
    weight 1000
    
    list do
      field :option_name
      field :option_value
      field :updated_at
      filters [:option_name]
      sort_by :option_name
    end
  end
  
  config.model Page do

    edit do
      field :title
      field :content, :text do
        ckeditor true
      end
      field :status
      field :welcome_page
      field :menu_order
    end
    
    list do
      field :title
      field :slug
      field :status
      field :welcome_page
      field :menu_order
    end
  end
end