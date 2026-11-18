// Import any needed model functions
import {
    getAllCategories,
    getCategoryDetails,
    getCategoriesByProjectId,
    updateCategoryAssignments,
    createCategory,
    updateCategory
} from '../models/categories.js';
import { getProjectsByCategoryId, getProjectDetails } from '../models/projects.js';
import { body, validationResult } from 'express-validator';

// PostgreSQL error code for a UNIQUE constraint violation
// (category names must be unique in the database)
const UNIQUE_VIOLATION = '23505';

// Define validation and sanitization rules for the create and edit category forms.
// The max length matches the database column (name VARCHAR(100)).
// The min length is only checked here, not on the form, so it can be tested.
const categoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        // Stop here if the name is empty, so only the "required" message shows
        .bail()
        .isLength({ min: 3, max: 100 })
        .withMessage('Category name must be between 3 and 100 characters')
];

// Define any controller functions
const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Project Categories';

    res.render('categories', { title, categories });
};

const showCategoryDetailsPage = async (req, res, next) => {
    const categoryId = req.params.id;
    const category = await getCategoryDetails(categoryId);

    // Send a 404 if no category has this ID
    if (!category) {
        const err = new Error('Category Not Found');
        err.status = 404;
        return next(err);
    }

    const projects = await getProjectsByCategoryId(categoryId);
    const title = 'Category Details';

    res.render('category', { title, category, projects });
};

const showAssignCategoriesForm = async (req, res, next) => {
    const projectId = req.params.projectId;

    const projectDetails = await getProjectDetails(projectId);

    // Send a 404 if no service project has this ID (same as the project details page)
    if (!projectDetails) {
        const err = new Error('Service Project Not Found');
        err.status = 404;
        return next(err);
    }

    const categories = await getAllCategories();
    const assignedCategories = await getCategoriesByProjectId(projectId);

    const title = 'Assign Categories to Project';

    res.render('assign-categories', { title, projectId, projectDetails, categories, assignedCategories });
};

const processAssignCategoriesForm = async (req, res, next) => {
    const projectId = req.params.projectId;

    // Send a 404 if no service project has this ID (same check as the GET route)
    const projectDetails = await getProjectDetails(projectId);
    if (!projectDetails) {
        const err = new Error('Service Project Not Found');
        err.status = 404;
        return next(err);
    }

    // In Express 5, req.body is undefined when a request has no body at all,
    // so use optional chaining (?.) instead of req.body.categoryIds
    const selectedCategoryIds = req.body?.categoryIds || [];

    // Ensure selectedCategoryIds is an array
    // (one checked box arrives as a single string, none arrives as undefined)
    const categoryIdsArray = Array.isArray(selectedCategoryIds) ? selectedCategoryIds : [selectedCategoryIds];

    // Validate BEFORE changing anything: updateCategoryAssignments deletes the old
    // assignments first, so a bad ID that failed during the inserts would leave the
    // project with missing categories. Every ID must belong to a real category.
    const allCategories = await getAllCategories();
    const validCategoryIds = allCategories.map((category) => String(category.category_id));
    const allValid = categoryIdsArray.every((categoryId) => validCategoryIds.includes(categoryId));

    if (!allValid) {
        req.flash('error', 'One or more selected categories are not valid.');
        return res.redirect(`/assign-categories/${projectId}`);
    }

    // Remove duplicates so the same category isn't inserted twice
    const uniqueCategoryIds = [...new Set(categoryIdsArray)];

    await updateCategoryAssignments(projectId, uniqueCategoryIds);
    req.flash('success', 'Categories updated successfully.');
    res.redirect(`/project/${projectId}`);
};

const showNewCategoryForm = async (req, res) => {
    const title = 'Add New Category';

    res.render('new-category', { title });
};

const processNewCategoryForm = async (req, res) => {
    // Check for validation errors
    const results = validationResult(req);
    if (!results.isEmpty()) {
        // Validation failed - loop through errors
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });

        // Redirect back to the new category form
        return res.redirect('/new-category');
    }

    const { name } = req.body;

    try {
        const categoryId = await createCategory(name);

        req.flash('success', 'Category added successfully!');
        res.redirect(`/category/${categoryId}`);
    } catch (error) {
        if (error.code === UNIQUE_VIOLATION) {
            req.flash('error', `A category named "${name}" already exists.`);
        } else {
            console.error('Error creating new category:', error);
            req.flash('error', 'There was an error creating the category.');
        }
        res.redirect('/new-category');
    }
};

const showEditCategoryForm = async (req, res, next) => {
    const categoryId = req.params.id;
    const category = await getCategoryDetails(categoryId);

    // Send a 404 if no category has this ID (same as the details page)
    if (!category) {
        const err = new Error('Category Not Found');
        err.status = 404;
        return next(err);
    }

    const title = 'Edit Category';
    res.render('edit-category', { title, category });
};

const processEditCategoryForm = async (req, res, next) => {
    const categoryId = req.params.id;

    // Check for validation errors
    const results = validationResult(req);
    if (!results.isEmpty()) {
        // Validation failed - loop through errors
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });

        // Redirect back to the edit category form
        return res.redirect(`/edit-category/${categoryId}`);
    }

    const { name } = req.body;

    try {
        await updateCategory(categoryId, name);

        req.flash('success', 'Category updated successfully!');
        res.redirect(`/category/${categoryId}`);
    } catch (error) {
        // No category has this ID: let the global error handler show the 404 page
        if (error.status === 404) {
            return next(error);
        }

        if (error.code === UNIQUE_VIOLATION) {
            req.flash('error', `A category named "${name}" already exists.`);
        } else {
            console.error('Error updating category:', error);
            req.flash('error', 'There was an error updating the category.');
        }
        res.redirect(`/edit-category/${categoryId}`);
    }
};

// Export any controller functions
export {
    showCategoriesPage,
    showCategoryDetailsPage,
    showAssignCategoriesForm,
    processAssignCategoriesForm,
    categoryValidation,
    showNewCategoryForm,
    processNewCategoryForm,
    showEditCategoryForm,
    processEditCategoryForm
};
