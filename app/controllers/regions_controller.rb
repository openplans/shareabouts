class RegionsController < ApplicationController

  
  def index
    @regions = Region.order "created_at desc"
  end
  
  def upload
    regions_count = 0
    
    file_handler = ShapefileHandler.new params[:file], request.session_options[:id], params[:region], params[:field_names]
    
    Delayed::Job.enqueue file_handler
    
    respond_to do |format|
      format.html {
        redirect_to regions_path, :notice => "Importing regions."
      }
    end
  end

end
