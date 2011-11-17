class RegionsController < ApplicationController

  
  def index
    @regions = Region.order "created_at desc"
  end
  
  def upload
    regions_count = 0
    
    file_handler = ShapefileHandler.open params[:file], request.session_options[:id] do |handler|
      regions_count = handler.create_regions params[:region], params[:field_names]
    end
    
    respond_to do |format|
      format.html {
        redirect_to regions_path, :notice => "#{regions_count} regions created."
      }
    end
  end

end
