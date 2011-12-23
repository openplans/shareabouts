class Page < ActiveRecord::Base
  
  StatusOptions = %w{draft published}

  belongs_to :author, :class_name => "Admin"
  belongs_to :parent, :class_name => "Page"
  has_many :pages, :foreign_key => :parent_id

  before_validation :populate_slug
  before_validation :populate_author
  
  validates :slug, :presence => true, :uniqueness => true
  validates :title, :presence => true
  validates :author_id, :presence => true
  validates :status, :presence => true, :inclusion => { :in => StatusOptions }
  
  scope :published, where(:status => "published")
  
  def status_enum
    StatusOptions
  end
  
  def to_param
    slug
  end
  
  private
  
  def populate_author
    self.author = Admin.current_admin
  end
  
  def populate_slug
    return unless title.present?
    if slug.blank?
      self.slug = ActiveSupport::Inflector.transliterate(title).downcase.gsub(/[^a-z0-9 ]/,' ').strip.gsub(/[ ]+/,'-')
    end
  end
end
