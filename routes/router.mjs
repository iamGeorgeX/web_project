import express from 'express';
import multer from 'multer';
const upload = multer();
const router = express.Router();

const controller= await import('../controllers/controller.mjs');
const authController = await import('../controllers/authController.mjs');

router.get('/', controller.home);
router.get('/dashboard',authController.requireLogin, controller.dashboard);
// router.get('/organiser-dashboard',requireOrganiserLogin, controller.organiser_dashboard);
router.get('/organiser-signup', controller.organiser_signup);
router.post('/organiser-signup', controller.organiser_signup_post); // Ensure organiser_signup_post is defined
router.get('/login', controller.login);
router.post('/login', controller.loginUser); // Ensure loginUser is defined
router.get('/signup', controller.user_signup);
router.get('/logout', controller.logout);
router.post('/signup', controller.user_signup_post); // Ensure user_signup_post is defined
router.get('/search', controller.searchEvents);
router.get('/event-stats',authController.requireOrganiserLogin, controller.event_stats);
router.get('/events', controller.events);
router.get('/event/:id', controller.event_info);
router.get('/set-event',authController.requireOrganiserLogin, controller.set_event);
router.post('/set-event',authController.requireOrganiserLogin,upload.single('event_image'), controller.newEvent);


router.get('/payment',authController.requireUserLogin, controller.payment);
router.post('/payment-submit',authController.requireUserLogin, controller.payment_submit);

router.get('/change-password', authController.requireLogin, controller.change_password);
router.post('/change-password', authController.requireLogin, controller.post_change_password);


router.get('/api/events', async (req, res) => {
    const category = req.query.category;
    let events = [];
    if (category === 'Δημοφιλη') {
        events = await controller.getPopularEvents();
    } else if (category === 'Προτεινόμενα') {
        events = await controller.getRecommendedEvents();
    } else if (category === 'Νέα') {
        events = await controller.getNewEvents();
    } else if (category === 'Κατηγορίες') {
        events = await controller.getAllEvents();
    } else {
        events = await controller.getEventsByCategory(category);
    }
    res.json(events);
});


export { router };