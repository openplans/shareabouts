# Pages are created by admins, and by default, are linked to in the header of 
# the app. Pages are loaded in the map's InformationPanel.

class Page < ActiveRecord::Base
  
  StatusOptions = %w{draft published}

  belongs_to :author, :class_name => "Admin", :inverse_of => :pages
  belongs_to :parent, :class_name => "Page"
  has_many :pages, :foreign_key => :parent_id

  before_validation :populate_slug
  before_validation :populate_author
  
  validates :slug, :presence => true, :uniqueness => true
  validates :title, :presence => true
  validates :author_id, :presence => true
  validates :status, :presence => true, :inclusion => { :in => StatusOptions }
  
  default_scope :order => 'menu_order ASC'
  scope :published, where(:status => "published")
  
  before_save :set_welcome_page_update_flag
  after_save :update_other_welcome_pages
  
  # Necessary for rails_admin status dropdown
  def status_enum
    StatusOptions
  end
  
  def to_param
    slug
  end
  
  private
  
  def populate_author
    if author.blank?
      self.author = Admin.current_admin
    end
  end
  
  def populate_slug
    return unless title.present?
    if slug.blank?
      self.slug = ActiveSupport::Inflector.transliterate(title).downcase.gsub(/[^a-z0-9 ]/,' ').strip.gsub(/[ ]+/,'-')
    end
  end
  
  private
  
  def set_welcome_page_update_flag
    @update_other_pages_welcome_page = true if changes[:welcome_page] && changes[:welcome_page].last
  end
  
  def update_other_welcome_pages
    Page.update_all( "welcome_page = false", "id <> #{id}" ) if @update_other_pages_welcome_page
  end
end
