"""AI-powered features using Emergent LLM integrations."""
import os
import uuid
import logging
from typing import List, Dict, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

# Get API key from environment
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')


class AIBioGenerator:
    """Generate attractive dating profile bios using GPT-5.2."""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def generate_bio(
        self,
        name: str,
        profession: str,
        interests: List[str],
        age: int = None,
        style: str = "confident"
    ) -> str:
        """
        Generate an attractive dating profile bio.
        
        Args:
            name: User's first name
            profession: User's profession (trucker, airline, military, etc.)
            interests: List of user interests
            age: User's age (optional)
            style: Bio style - "confident", "playful", "mysterious", "romantic"
        
        Returns:
            Generated bio text
        """
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"bio_gen_{uuid.uuid4().hex[:8]}",
            system_message="""You are an expert dating profile writer for Journeyman, a premium dating app for travelers.
            Write compelling, authentic bios that highlight the unique lifestyle of men who travel for work or adventure.
            Keep bios between 100-200 characters. Be creative but genuine. Avoid clichés.
            The bio should make the reader want to swipe right and start a conversation."""
        ).with_model("openai", "gpt-5.2")
        
        interests_str = ", ".join(interests) if interests else "traveling, meeting new people"
        age_str = f"Age: {age}. " if age else ""
        
        prompt = f"""Write a {style} dating profile bio for:
Name: {name}
Profession: {profession}
{age_str}Interests: {interests_str}

The bio should feel authentic and showcase their adventurous traveler lifestyle.
Write ONLY the bio text, nothing else. No quotes around it."""
        
        user_message = UserMessage(text=prompt)
        
        try:
            response = await chat.send_message(user_message)
            return response.strip().strip('"').strip("'")
        except Exception as e:
            logger.error(f"Bio generation error: {e}")
            raise


class AIIceBreakerGenerator:
    """Generate conversation ice breakers using Claude."""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def generate_ice_breakers(
        self,
        your_profile: Dict,
        their_profile: Dict,
        count: int = 3
    ) -> List[str]:
        """
        Generate personalized conversation starters.
        
        Args:
            your_profile: Current user's profile data
            their_profile: Match's profile data
            count: Number of ice breakers to generate
        
        Returns:
            List of ice breaker messages
        """
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"icebreaker_{uuid.uuid4().hex[:8]}",
            system_message="""You are a witty conversation expert for Journeyman, a dating app for travelers.
            Generate creative, personalized ice breakers that reference shared interests or unique profile details.
            Messages should be friendly, not too forward, and invite a response.
            Keep each message under 100 characters. Be playful but respectful."""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        your_interests = ", ".join(your_profile.get("interests", [])) or "traveling"
        their_interests = ", ".join(their_profile.get("interests", [])) or "traveling"
        their_profession = their_profile.get("profession", "traveler")
        their_bio = their_profile.get("bio", "")
        their_name = their_profile.get("name", "").split()[0] if their_profile.get("name") else "them"
        
        prompt = f"""Generate {count} unique ice breaker messages to start a conversation with someone.

Their profile:
- Name: {their_name}
- Profession: {their_profession}
- Interests: {their_interests}
- Bio: {their_bio[:100] if their_bio else 'Not provided'}

Your interests: {your_interests}

Write {count} different opening messages. Number them 1-{count}.
Each should be short, engaging, and reference something from their profile or shared interests.
Do NOT use generic openers like "Hey" or "How are you"."""
        
        user_message = UserMessage(text=prompt)
        
        try:
            response = await chat.send_message(user_message)
            
            # Parse numbered responses
            lines = response.strip().split('\n')
            ice_breakers = []
            for line in lines:
                line = line.strip()
                if line and line[0].isdigit():
                    # Remove number prefix
                    text = line.split('.', 1)[-1].strip() if '.' in line else line[2:].strip()
                    text = text.strip('"').strip("'")
                    if text:
                        ice_breakers.append(text)
            
            return ice_breakers[:count]
        except Exception as e:
            logger.error(f"Ice breaker generation error: {e}")
            raise


class AISmartMatcher:
    """Calculate AI-powered compatibility scores using Gemini."""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def calculate_compatibility(
        self,
        user1_profile: Dict,
        user2_profile: Dict
    ) -> Dict:
        """
        Calculate compatibility score between two users.
        
        Args:
            user1_profile: First user's profile
            user2_profile: Second user's profile
        
        Returns:
            Dict with score (0-100) and reasons
        """
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"match_{uuid.uuid4().hex[:8]}",
            system_message="""You are a compatibility analyst for Journeyman, a dating app for travelers.
            Analyze two profiles and provide a compatibility score with reasoning.
            Consider: shared interests, lifestyle compatibility (both travelers), profession compatibility,
            location/travel patterns, and potential conversation topics.
            Be realistic but optimistic. Travelers often connect well due to shared lifestyle understanding."""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        def format_profile(p: Dict, label: str) -> str:
            return f"""{label}:
- Profession: {p.get('profession', 'Unknown')}
- Interests: {', '.join(p.get('interests', [])) or 'Not specified'}
- Bio: {p.get('bio', 'Not provided')[:150]}
- Location: {p.get('location', 'Unknown')}
- Age: {p.get('age', 'Unknown')}"""
        
        prompt = f"""Analyze compatibility between these two users:

{format_profile(user1_profile, "User 1")}

{format_profile(user2_profile, "User 2")}

Provide your analysis in this EXACT format:
SCORE: [number 0-100]
REASONS:
- [reason 1]
- [reason 2]
- [reason 3]
CONVERSATION_TOPICS:
- [topic 1]
- [topic 2]"""
        
        user_message = UserMessage(text=prompt)
        
        try:
            response = await chat.send_message(user_message)
            
            # Parse response
            result = {
                "score": 75,  # Default
                "reasons": [],
                "conversation_topics": []
            }
            
            lines = response.strip().split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if line.startswith("SCORE:"):
                    try:
                        score_text = line.replace("SCORE:", "").strip()
                        result["score"] = min(100, max(0, int(float(score_text))))
                    except:
                        pass
                elif line == "REASONS:":
                    current_section = "reasons"
                elif line == "CONVERSATION_TOPICS:":
                    current_section = "conversation_topics"
                elif line.startswith("-") and current_section:
                    text = line[1:].strip()
                    if text:
                        result[current_section].append(text)
            
            return result
        except Exception as e:
            logger.error(f"Compatibility calculation error: {e}")
            raise


class AIFirstMessageGenerator:
    """Generate perfect first messages combining compatibility + ice breakers."""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def generate_first_message(
        self,
        your_profile: Dict,
        their_profile: Dict,
        tone: str = "friendly"
    ) -> Dict:
        """
        Generate a personalized first message for a new match.
        
        Args:
            your_profile: Current user's profile data
            their_profile: Match's profile data
            tone: Message tone - "friendly", "flirty", "witty", "sincere"
        
        Returns:
            Dict with message, talking_points, and confidence_score
        """
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"first_msg_{uuid.uuid4().hex[:8]}",
            system_message="""You are a dating conversation expert for Journeyman, a premium dating app for travelers.
            Generate the PERFECT first message for a new match. The message should:
            - Feel personal and reference specific details from their profile
            - Be warm and inviting, not creepy or generic
            - Be short (under 100 characters) but memorable
            - Make them want to respond immediately
            - Subtly acknowledge the shared traveler lifestyle
            You'll also provide 2-3 follow-up talking points if they respond."""
        ).with_model("openai", "gpt-5.2")
        
        your_name = your_profile.get("name", "").split()[0] if your_profile.get("name") else "you"
        your_interests = ", ".join(your_profile.get("interests", [])) or "traveling"
        your_profession = your_profile.get("profession", "traveler")
        
        their_name = their_profile.get("name", "").split()[0] if their_profile.get("name") else "them"
        their_interests = ", ".join(their_profile.get("interests", [])) or "traveling"
        their_profession = their_profile.get("profession", "traveler")
        their_bio = their_profile.get("bio", "")[:150] if their_profile.get("bio") else ""
        their_location = their_profile.get("location", "")
        
        # Find shared interests
        your_interest_set = set(i.lower() for i in your_profile.get("interests", []))
        their_interest_set = set(i.lower() for i in their_profile.get("interests", []))
        shared = your_interest_set & their_interest_set
        shared_interests = ", ".join(shared) if shared else "traveling lifestyle"
        
        prompt = f"""Generate a {tone} first message for a new match on a dating app.

YOUR PROFILE:
- Name: {your_name}
- Profession: {your_profession}
- Interests: {your_interests}

THEIR PROFILE:
- Name: {their_name}
- Profession: {their_profession}
- Location: {their_location}
- Bio: {their_bio}
- Interests: {their_interests}

SHARED INTERESTS: {shared_interests}

Generate your response in this EXACT format:
MESSAGE: [your opening message - under 100 chars, reference something specific]
TALKING_POINTS:
- [follow-up topic 1 if they respond]
- [follow-up topic 2 if they respond]
CONFIDENCE: [1-10 how likely they'll respond based on compatibility]
WHY_IT_WORKS: [brief explanation of why this message is effective]"""
        
        user_message = UserMessage(text=prompt)
        
        try:
            response = await chat.send_message(user_message)
            
            # Parse response
            result = {
                "message": "",
                "talking_points": [],
                "confidence_score": 7,
                "why_it_works": "",
                "their_name": their_name,
                "shared_interests": list(shared) if shared else []
            }
            
            lines = response.strip().split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if line.startswith("MESSAGE:"):
                    result["message"] = line.replace("MESSAGE:", "").strip().strip('"').strip("'")
                elif line == "TALKING_POINTS:":
                    current_section = "talking_points"
                elif line.startswith("CONFIDENCE:"):
                    try:
                        score = line.replace("CONFIDENCE:", "").strip()
                        result["confidence_score"] = min(10, max(1, int(float(score))))
                    except:
                        pass
                elif line.startswith("WHY_IT_WORKS:"):
                    result["why_it_works"] = line.replace("WHY_IT_WORKS:", "").strip()
                elif line.startswith("-") and current_section == "talking_points":
                    text = line[1:].strip()
                    if text:
                        result["talking_points"].append(text)
            
            return result
        except Exception as e:
            logger.error(f"First message generation error: {e}")
            raise


class AIConversationRevival:
    """Generate playful messages to revive stalling conversations using Claude."""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def generate_revival_messages(
        self,
        your_profile: Dict,
        their_profile: Dict,
        last_messages: List[Dict],
        hours_since_last: int = 24
    ) -> Dict:
        """
        Generate messages to revive a stalling conversation.
        
        Args:
            your_profile: Current user's profile data
            their_profile: Match's profile data
            last_messages: Recent messages in the conversation
            hours_since_last: Hours since last message
        
        Returns:
            Dict with revival messages, context, and tips
        """
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"revival_{uuid.uuid4().hex[:8]}",
            system_message="""You are a conversation revival expert for Journeyman, a dating app for travelers.
            Your job is to help users re-engage matches when conversations go quiet.
            Generate messages that are:
            - Playful and light-hearted (not desperate or needy)
            - Reference something from the previous conversation OR their profile
            - Create curiosity or invite easy responses
            - Feel natural, like something a confident person would say
            - Short (under 80 characters) - brevity is attractive
            
            Also provide context on WHY the conversation might have stalled and tips for keeping it going."""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        their_name = their_profile.get("name", "").split()[0] if their_profile.get("name") else "them"
        their_interests = ", ".join(their_profile.get("interests", [])) or "traveling"
        their_profession = their_profile.get("profession", "traveler")
        
        # Format recent messages
        message_context = ""
        if last_messages:
            for msg in last_messages[-5:]:  # Last 5 messages
                sender = "You" if msg.get("sender_id") == your_profile.get("user_id") else their_name
                content = msg.get("content", "")[:100]
                message_context += f"{sender}: {content}\n"
        else:
            message_context = "No previous messages - conversation just started"
        
        time_context = f"{hours_since_last} hours" if hours_since_last < 48 else f"{hours_since_last // 24} days"
        
        prompt = f"""A conversation has gone quiet for {time_context}. Help revive it!

THEIR PROFILE:
- Name: {their_name}
- Profession: {their_profession}
- Interests: {their_interests}

RECENT MESSAGES:
{message_context}

Generate your response in this EXACT format:
REVIVAL_MESSAGES:
- [playful re-engagement message 1]
- [playful re-engagement message 2]
- [playful re-engagement message 3]
STALL_REASON: [brief analysis of why conversation might have stalled]
TIPS:
- [tip 1 for keeping conversation flowing]
- [tip 2 for keeping conversation flowing]
URGENCY: [1-10 how urgent it is to reach out - 10 = might lose them]"""
        
        user_message = UserMessage(text=prompt)
        
        try:
            response = await chat.send_message(user_message)
            
            # Parse response
            result = {
                "revival_messages": [],
                "stall_reason": "",
                "tips": [],
                "urgency": 5,
                "their_name": their_name,
                "hours_since_last": hours_since_last
            }
            
            lines = response.strip().split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if line == "REVIVAL_MESSAGES:":
                    current_section = "revival_messages"
                elif line.startswith("STALL_REASON:"):
                    result["stall_reason"] = line.replace("STALL_REASON:", "").strip()
                elif line == "TIPS:":
                    current_section = "tips"
                elif line.startswith("URGENCY:"):
                    try:
                        score = line.replace("URGENCY:", "").strip()
                        result["urgency"] = min(10, max(1, int(float(score))))
                    except:
                        pass
                elif line.startswith("-") and current_section:
                    text = line[1:].strip().strip('"').strip("'")
                    if text:
                        result[current_section].append(text)
            
            return result
        except Exception as e:
            logger.error(f"Conversation revival error: {e}")
            raise


# Singleton instances
bio_generator = AIBioGenerator()
ice_breaker_generator = AIIceBreakerGenerator()
smart_matcher = AISmartMatcher()
first_message_generator = AIFirstMessageGenerator()
conversation_revival = AIConversationRevival()
