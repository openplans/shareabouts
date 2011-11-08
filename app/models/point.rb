class Point < CartoModel
  
  # merges top-level lat & lng into point object
  def self.new_from_params(params)
    if params[:point]
      params[:point][:lat] = params[:lat] if params[:lat] 
      params[:point][:lng] = params[:lng] if params[:lng] 
      new params[:point]
    else
      new params
    end
  end
  
  def as_geo_json
    {
      :type => "Feature", 
      :geometry => {
        :type => "Point", 
        :coordinates => [lng, lat]
      },
      :properties => {
        :id             => cartodb_id,
        :name           => name,
        :description    => description
      }
    }
  end
end
