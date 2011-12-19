class Admin < ActiveRecord::Base
  devise :database_authenticatable, :trackable, :timeoutable, :lockable
  
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