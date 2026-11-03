-- Organizations table
CREATE TABLE organization ( 
organization_id SERIAL PRIMARY KEY,
name VARCHAR(150) NOT NULL,
description TEXT NOT NULL,
contact_email VARCHAR(255) NOT NULL,	
logo_filename VARCHAR(255) NOT NULL
);

-- Sample organizations
INSERT INTO organization (name, description, contact_email, logo_filename)
VALUES ('BrightFuture Builders','A nonprofit focused on improving community infrastructure through sustainable construction projects.', 'info@brightfuturebuilders.org', 'brightfuture-logo.png'),
	('GreenHarvest Growers', 'An urban farming collective promoting food sustainability and education in local neighborhoods.', 'contact@greenharvest.org', 'greenharvest-logo.png'),
	('UnityServe Volunteers', 'A volunteer coordination group supporting local charities and service initiatives.', 'hello@unityserve.org', 'unityserve-logo.png');

-- Service projects table (each project is sponsored by one organization)
CREATE TABLE project (
project_id SERIAL PRIMARY KEY,
organization_id INTEGER NOT NULL REFERENCES organization(organization_id),
title VARCHAR(150) NOT NULL,
description TEXT NOT NULL,
location VARCHAR(255) NOT NULL,
date DATE NOT NULL
);

-- Sample service projects (5 per organization)
INSERT INTO project (organization_id, title, description, location, date)
VALUES (1, 'Community Playground Build', 'Help assemble a new accessible playground for neighborhood children.', 'Riverside Park, Rexburg, ID', '2026-11-14'),
	(1, 'Senior Home Repair Day', 'Make minor repairs and safety upgrades to the homes of elderly residents.', 'Downtown Rexburg, ID', '2026-11-21'),
	(1, 'Affordable Home Framing Weekend', 'Frame walls for an affordable family home alongside experienced builders.', '450 S 2nd W, Rexburg, ID', '2026-12-05'),
	(1, 'Park Bench Restoration', 'Sand, repair, and repaint park benches and picnic tables.', 'Porter Park, Rexburg, ID', '2027-01-16'),
	(1, 'Accessible Ramp Installation', 'Build wheelchair ramps for community members with mobility needs.', 'Idaho Falls, ID', '2027-02-06'),
	(2, 'Community Garden Planting', 'Prepare garden beds and plant seasonal vegetables for the neighborhood.', 'Madison County Community Garden, Rexburg, ID', '2026-11-07'),
	(2, 'Backyard Composting Workshop', 'Teach families how to start and maintain a backyard compost pile.', 'Madison Library, Rexburg, ID', '2026-11-18'),
	(2, 'Greenhouse Winter Prep', 'Insulate the community greenhouse and transplant seedlings for winter.', 'GreenHarvest Greenhouse, Rexburg, ID', '2026-12-12'),
	(2, 'School Garden Lessons', 'Lead hands-on gardening lessons for elementary school students.', 'Kennedy Elementary, Rexburg, ID', '2027-01-23'),
	(2, 'Farmers Market Produce Rescue', 'Collect surplus produce at the market and deliver it to the local food pantry.', 'Rexburg Farmers Market, Rexburg, ID', '2027-03-13'),
	(3, 'Holiday Food Drive', 'Collect, sort, and package food donations for families in need.', 'Rexburg Community Center, Rexburg, ID', '2026-11-28'),
	(3, 'Coat and Blanket Drive', 'Gather warm winter clothing and blankets and deliver them to local shelters.', 'Idaho Falls Rescue Mission, Idaho Falls, ID', '2026-12-19'),
	(3, 'Senior Center Game Night', 'Spend an evening playing games and visiting with seniors.', 'Rexburg Senior Center, Rexburg, ID', '2027-01-09'),
	(3, 'After-School Tutoring', 'Tutor students in reading and math after school.', 'Madison Middle School, Rexburg, ID', '2027-02-20'),
	(3, 'Community Blood Drive', 'Greet donors, run check-in, and serve refreshments at a community blood drive.', 'Manwaring Center, Rexburg, ID', '2027-03-27');
