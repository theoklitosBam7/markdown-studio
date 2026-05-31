#!/usr/bin/env ruby

require 'json'
require 'net/http'
require 'uri'
require 'yaml'

LABELS_FILE = ENV.fetch('LABELS_FILE', '.github/labels.yml')
REPOSITORY = ENV['GITHUB_REPOSITORY']
TOKEN = ENV['GITHUB_TOKEN']
DRY_RUN = ENV.fetch('DRY_RUN', 'false') == 'true'
DELETE_MISSING = ENV.fetch('DELETE_MISSING', 'false') == 'true'
VALIDATE_ONLY = ENV.fetch('VALIDATE_ONLY', 'false') == 'true'

def fail_with(message)
  warn(message)
  exit(1)
end

def normalize_color(color)
  color.to_s.delete_prefix('#').upcase
end

def normalize_description(description)
  description.to_s
end

def label_path(name)
  URI.encode_www_form_component(name).gsub('+', '%20')
end

def request(method, path, body = nil)
  fail_with('GITHUB_REPOSITORY is required unless VALIDATE_ONLY=true.') if REPOSITORY.nil? || REPOSITORY.empty?
  fail_with('GITHUB_TOKEN is required unless VALIDATE_ONLY=true.') if TOKEN.nil? || TOKEN.empty?

  uri = URI("https://api.github.com/repos/#{REPOSITORY}#{path}")
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true

  klass = {
    get: Net::HTTP::Get,
    post: Net::HTTP::Post,
    patch: Net::HTTP::Patch,
    delete: Net::HTTP::Delete,
  }.fetch(method)

  req = klass.new(uri)
  req['Accept'] = 'application/vnd.github+json'
  req['Authorization'] = "Bearer #{TOKEN}"
  req['User-Agent'] = 'markdown-studio-label-sync'
  req['X-GitHub-Api-Version'] = '2022-11-28'

  if body
    req['Content-Type'] = 'application/json'
    req.body = JSON.generate(body)
  end

  response = http.request(req)
  unless response.code.to_i.between?(200, 299)
    fail_with("GitHub API #{method.upcase} #{path} failed with #{response.code}: #{response.body}")
  end

  response
end

def load_desired_labels
  fail_with("#{LABELS_FILE} does not exist.") unless File.file?(LABELS_FILE)

  raw = YAML.safe_load(File.read(LABELS_FILE), permitted_classes: [], aliases: false)
  labels = raw.fetch('labels') { fail_with("#{LABELS_FILE} must contain a top-level labels: array.") }
  fail_with("#{LABELS_FILE} labels: must be an array.") unless labels.is_a?(Array)

  names = {}
  labels.map.with_index(1) do |label, index|
    fail_with("Label ##{index} must be a mapping.") unless label.is_a?(Hash)

    name = label['name'].to_s.strip
    color = normalize_color(label['color'])
    description = normalize_description(label['description'])

    fail_with("Label ##{index} is missing name.") if name.empty?
    fail_with("Label #{name.inspect} is duplicated.") if names[name]
    fail_with("Label #{name.inspect} must use a 6-character hex color.") unless color.match?(/\A[0-9A-F]{6}\z/)
    fail_with("Label #{name.inspect} description must be 100 characters or less.") if description.length > 100

    names[name] = true
    { 'name' => name, 'color' => color, 'description' => description }
  end
end

def fetch_existing_labels
  labels = []
  page = 1

  loop do
    response = request(:get, "/labels?per_page=100&page=#{page}")
    batch = JSON.parse(response.body)
    labels.concat(batch)
    break if batch.length < 100

    page += 1
  end

  labels.to_h { |label| [label.fetch('name'), label] }
end

desired_labels = load_desired_labels
puts "Validated #{desired_labels.length} labels from #{LABELS_FILE}."

if VALIDATE_ONLY
  puts 'Validation-only mode; no GitHub API calls were made.'
  exit(0)
end

existing_labels = fetch_existing_labels
desired_names = desired_labels.map { |label| label.fetch('name') }

desired_labels.each do |label|
  existing = existing_labels[label.fetch('name')]
  payload = {
    color: label.fetch('color'),
    description: label.fetch('description'),
  }

  if existing.nil?
    puts "#{DRY_RUN ? 'Would create' : 'Creating'} #{label.fetch('name')}"
    request(:post, '/labels', payload.merge(name: label.fetch('name'))) unless DRY_RUN
    next
  end

  color_changed = normalize_color(existing['color']) != label.fetch('color')
  description_changed = normalize_description(existing['description']) != label.fetch('description')

  if color_changed || description_changed
    puts "#{DRY_RUN ? 'Would update' : 'Updating'} #{label.fetch('name')}"
    request(:patch, "/labels/#{label_path(label.fetch('name'))}", payload) unless DRY_RUN
  else
    puts "Unchanged #{label.fetch('name')}"
  end
end

missing_labels = existing_labels.keys - desired_names
if missing_labels.empty?
  puts 'No labels are missing from the canonical file.'
elsif DELETE_MISSING
  missing_labels.each do |name|
    puts "#{DRY_RUN ? 'Would delete' : 'Deleting'} #{name}"
    request(:delete, "/labels/#{label_path(name)}") unless DRY_RUN
  end
else
  puts 'Labels absent from the canonical file were left untouched:'
  missing_labels.sort.each { |name| puts "  - #{name}" }
end
