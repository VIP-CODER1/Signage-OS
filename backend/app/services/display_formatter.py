from app.models.display import Display
from app.models.content_profile import ContentProfile
from app.schemas.display import DisplayResponse, ContentProfileRef


async def format_display_response(display: Display) -> dict:
    profiles = []
    for link in display.content_profiles:
        if isinstance(link, ContentProfile):
            cp = link
        else:
            cp = await link.fetch()
        profiles.append(ContentProfileRef(
            id=str(cp.id),
            name=cp.name,
            priority=cp.priority,
        ))

    return DisplayResponse(
        id=str(display.id),
        display_id=display.display_id,
        name=display.name,
        ip_address=display.ip_address,
        location=display.location,
        status=display.status,
        content_profiles=profiles,
        created_at=display.created_at,
        updated_at=display.updated_at,
    )
