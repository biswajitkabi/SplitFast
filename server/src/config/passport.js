import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import prismaClientPkg from '@prisma/client'

const { PrismaClient } = prismaClientPkg
const prisma = new PrismaClient()

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email:    profile.emails[0].value,
          name:     profile.displayName,
          avatar:   profile.photos[0]?.value
        }
      })
    }

    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

export default passport
