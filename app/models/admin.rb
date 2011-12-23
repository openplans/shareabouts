class Admin < ActiveRecord::Base
  cattr_accessor :current_admin # for setting author in rails_admin
  
  devise :database_authenticatable, :trackable, :timeoutable, :lockable
  
  has_many :pages
  
  def level
    read_attribute(:level) || 0
  end
  
  def role?(rolename)
    case rolename
    when :superadmin
      return level >= 100
    else
      return false
    end
  end
end