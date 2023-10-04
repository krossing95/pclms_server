import express from "express"
import UserMiddleware from "../middlewares/middleware.user.js"
import FavoriteListController from "../controllers/favorites/controller.favorites.js"

const favoritesRouter = express.Router()

const favoritesControllers = FavoriteListController()

favoritesRouter.get('/', UserMiddleware, favoritesControllers.get_favorites)
favoritesRouter.get('/search', UserMiddleware, favoritesControllers.search_favorites)
favoritesRouter.get('/filter', UserMiddleware, favoritesControllers.filter_favorites)

export default favoritesRouter