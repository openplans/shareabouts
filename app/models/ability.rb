class Ability
  include CanCan::Ability

  def initialize(user)
    user ||= User.new # guest user (not logged in)
    
    if user.is_a? Admin
      can :manage, :all
    else
      can :create, FeaturePoint
      can :create, Comment
      can :create, Vote
      can :read, All
    end
  end
end
