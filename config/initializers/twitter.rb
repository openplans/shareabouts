# Twitter consumer key and secret for the twitter gem.
# The constants are set in config/initializers/devise.rb
Twitter.configure do |config|
  config.consumer_key    = TWITTER_CONSUMER_KEY
  config.consumer_secret = TWITTER_CONSUMER_SECRET
end