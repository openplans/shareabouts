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
  config.included_models += %w{SiteOption Admin FeaturePoint Comment}

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
  config.model SiteOption do
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
  
  config.model Admin do
    weight 500
  end
  
  config.model Comment do
    object_label_method :comment 
    configure :commentable do
      # configuration here
    end
  end
  
  config.model FeaturePoint do
    object_label_method :display_name     # Name of the method called for pretty printing an *instance* of ModelName
    weight 100                     # Navigation priority. Bigger is higher.

    list do
      items_per_page 100
      field :id
      field :visible
      field :name
      field :display_the_geom do
        label 'Location'
      end
      # field :display_submitter do
      #   label 'Submitter'
      # end
      field :created_at
      # filters [:id, :name]  # Array of field names which filters should be shown by default in the table header
      # sort_by :id           # Sort column (default is primary key)
      # sort_reverse true     # Sort direction (default is true for primary key, last created first)
    end
    
    # label 'My model'              # Name of ModelName (smartly defaults to ActiveRecord's I18n API)
    # label_plural 'My models'      # Same, plural
    # parent OtherModel             # Set parent model for navigation. MyModel will be nested below. OtherModel will be on first position of the dropdown
    # navigation_label              # Sets dropdown entry's name in navigation. Only for parents!
    #   show do
    #     # Here goes the fields configuration for the show view
    #   end
    #   export do
    #     # Here goes the fields configuration for the export view (CSV, yaml, XML)
    #   end
    #   edit do
    #     # Here goes the fields configuration for the edit view (for create and update view)
    #   end
    #   create do
    #     # Here goes the fields configuration for the create view, overriding edit section settings
    #   end
    #   update do
    #     # Here goes the fields configuration for the update view, overriding edit section settings
    #   end
  end

# fields configuration is described in the Readme, if you have other question, ask us on the mailing-list!

#  ==> Your models configuration, to help you get started!

end

# You made it this far? You're looking for something that doesn't exist! Add it to RailsAdmin and send us a Pull Request!
