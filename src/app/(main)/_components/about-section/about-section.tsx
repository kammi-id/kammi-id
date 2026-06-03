import { getAboutSettings } from '~/app/(main)/_data/site-settings'
import { AboutSectionClient } from './about-section-client'

export const AboutSection = async () => {
  const about = await getAboutSettings()

  return (
    <AboutSectionClient
      paragraph1={about.paragraph1}
      paragraph2={about.paragraph2}
      readMoreHref={about.readMoreHref}
      readMoreLabel={about.readMoreLabel}
      sejarahCardTitle={about.sejarahCardTitle}
      sejarahCardDescription={about.sejarahCardDescription}
      sejarahCardLinkHref={about.sejarahCardLinkHref}
      sejarahCardLinkLabel={about.sejarahCardLinkLabel}
    />
  )
}
